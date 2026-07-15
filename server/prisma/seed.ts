import { faker } from "@faker-js/faker";
import { PrismaClient, PropertyType, ListingType } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const prisma = new PrismaClient();

const TOTAL_PROPERTIES = 50_500;
const TOTAL_OWNERS = 300;
const BATCH_SIZE = 1000;

const CITIES: Record<string, string[]> = {
  Mumbai: ["Bandra", "Andheri", "Powai", "Worli", "Chembur", "Malad"],
  Delhi: ["Dwarka", "Rohini", "Saket", "Vasant Kunj", "Karol Bagh"],
  Bangalore: ["Whitefield", "Koramangala", "Indiranagar", "HSR Layout", "Electronic City"],
  Pune: ["Kothrud", "Hinjewadi", "Baner", "Viman Nagar", "Wakad"],
  Hyderabad: ["Gachibowli", "Madhapur", "Banjara Hills", "Kondapur"],
  Chennai: ["Adyar", "Velachery", "T Nagar", "Anna Nagar"],
  Kolkata: ["Salt Lake", "Ballygunge", "New Town", "Behala"],
  Ahmedabad: ["Satellite", "Bopal", "Vastrapur", "Prahladnagar"],
  Gurgaon: ["Sector 56", "DLF Phase 3", "Sohna Road", "Golf Course Road"],
  Noida: ["Sector 62", "Sector 137", "Sector 76", "Greater Noida West"],
};
const CITY_NAMES = Object.keys(CITIES);
const STATE_BY_CITY: Record<string, string> = {
  Mumbai: "Maharashtra",
  Delhi: "Delhi",
  Bangalore: "Karnataka",
  Pune: "Maharashtra",
  Hyderabad: "Telangana",
  Chennai: "Tamil Nadu",
  Kolkata: "West Bengal",
  Ahmedabad: "Gujarat",
  Gurgaon: "Haryana",
  Noida: "Uttar Pradesh",
};

const PROPERTY_TYPES = Object.values(PropertyType);
const LISTING_TYPES = Object.values(ListingType);

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seedOwners(): Promise<string[]> {
  console.log(`Seeding ${TOTAL_OWNERS} owners...`);
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@realestate.test" },
    update: {},
    create: {
      id: crypto.randomUUID(),
      name: "Demo Owner",
      email: "demo@realestate.test",
      passwordHash,
      phone: "+919876543210",
    },
  });

  void demoUser;
  const users = Array.from({ length: TOTAL_OWNERS - 1 }).map(() => ({
    id: crypto.randomUUID(),
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    passwordHash,
    phone: `+91${faker.string.numeric(10)}`,
  }));

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);
    await prisma.user.createMany({ data: batch, skipDuplicates: true });
  }

  // Re-fetch actual ids: skipDuplicates may have silently dropped rows whose
  // faker-generated email collided, so we can't trust the generated array as-is.
  const allOwners = await prisma.user.findMany({ select: { id: true } });
  return allOwners.map((u) => u.id);
}

function buildProperty(ownerIds: string[]) {
  const city = randomFrom(CITY_NAMES);
  const locality = randomFrom(CITIES[city]);
  const propertyType = randomFrom(PROPERTY_TYPES);
  const listingType = randomFrom(LISTING_TYPES);
  const isPlot = propertyType === "PLOT";
  const isCommercial = propertyType === "COMMERCIAL";
  const bedrooms = isPlot || isCommercial ? null : faker.number.int({ min: 1, max: 5 });
  const bathrooms = isPlot ? null : faker.number.int({ min: 1, max: (bedrooms ?? 3) + 1 });
  const areaSqft = faker.number.int({ min: 400, max: 5000 });
  const basePricePerSqft = listingType === "RENT" ? faker.number.int({ min: 20, max: 100 }) : faker.number.int({ min: 3000, max: 25000 });
  const price = areaSqft * basePricePerSqft;

  return {
    id: crypto.randomUUID(),
    title: `${bedrooms ? bedrooms + "BHK " : ""}${propertyType.replace("_", " ")} in ${locality}, ${city}`,
    description: faker.lorem.paragraphs(2),
    propertyType,
    listingType,
    price,
    areaSqft,
    bedrooms,
    bathrooms,
    city,
    locality,
    state: STATE_BY_CITY[city],
    pincode: faker.string.numeric(6),
    address: `${faker.location.buildingNumber()}, ${locality}, ${city}`,
    status: "ACTIVE" as const,
    ownerId: randomFrom(ownerIds),
    createdAt: faker.date.past({ years: 2 }),
  };
}

async function seedProperties(ownerIds: string[]) {
  console.log(`Seeding ${TOTAL_PROPERTIES} properties (batches of ${BATCH_SIZE})...`);
  let seeded = 0;

  while (seeded < TOTAL_PROPERTIES) {
    const count = Math.min(BATCH_SIZE, TOTAL_PROPERTIES - seeded);
    const batch = Array.from({ length: count }).map(() => buildProperty(ownerIds));

    await prisma.property.createMany({ data: batch });

    const images = batch.flatMap((p) => {
      const imageCount = faker.number.int({ min: 1, max: 4 });
      return Array.from({ length: imageCount }).map((_, idx) => ({
        id: crypto.randomUUID(),
        propertyId: p.id,
        url: `https://picsum.photos/seed/${p.id}-${idx}/800/600`,
        isPrimary: idx === 0,
        sortOrder: idx,
      }));
    });
    await prisma.propertyImage.createMany({ data: images });

    seeded += count;
    console.log(`  ${seeded}/${TOTAL_PROPERTIES} properties seeded`);
  }
}

async function main() {
  const existingCount = await prisma.property.count();
  if (existingCount >= TOTAL_PROPERTIES) {
    console.log(`Already have ${existingCount} properties, skipping seed. Run 'prisma migrate reset' to reseed.`);
    return;
  }

  const ownerIds = await seedOwners();
  await seedProperties(ownerIds);

  const finalCount = await prisma.property.count();
  console.log(`Done. Total properties: ${finalCount}`);
  console.log(`Demo login: demo@realestate.test / Password123!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
