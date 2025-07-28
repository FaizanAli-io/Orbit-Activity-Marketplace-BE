import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CategoryData {
  name: string;
  subcategories: string[];
}

interface CategoriesFile {
  categories: CategoryData[];
}

async function populateCategories() {
  try {
    console.log('Starting category population...');

    // Read the categories JSON file
    const categoriesPath = path.join(__dirname, 'categories.json');
    const fileContent = fs.readFileSync(categoriesPath, 'utf-8');
    const categoriesData: CategoriesFile = JSON.parse(fileContent);

    console.log(
      `Found ${categoriesData.categories.length} main categories to create`,
    );

    // First pass: Create all main categories
    const mainCategories = new Map<string, number>();

    for (const categoryData of categoriesData.categories) {
      const mainCategory = await prisma.category.create({
        data: { name: categoryData.name },
      });
      mainCategories.set(categoryData.name, mainCategory.id);
      console.log(
        `Created main category: ${categoryData.name} (ID: ${mainCategory.id})`,
      );
    }

    // Second pass: Create all subcategories
    for (const categoryData of categoriesData.categories) {
      const parentId = mainCategories.get(categoryData.name);
      if (!parentId) {
        console.warn(`Parent category not found: ${categoryData.name}`);
        continue;
      }

      for (const subcategoryName of categoryData.subcategories) {
        await prisma.category.create({
          data: {
            name: subcategoryName,
            parentId: parentId,
          },
        });
        console.log(
          `Created subcategory: ${subcategoryName} under ${categoryData.name}`,
        );
      }
    }

    console.log('Category population completed successfully!');

    // Display the created categories
    const allCategories = await prisma.category.findMany({
      include: { parent: true, children: true },
    });

    console.log('\nCreated categories:');
    allCategories.forEach((category) => {
      if (!category.parentId) {
        console.log(`- ${category.name} (Main Category)`);
        category.children.forEach((child) => {
          console.log(`  └─ ${child.name}`);
        });
      }
    });
  } catch (error) {
    console.error('Error populating categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
populateCategories();
