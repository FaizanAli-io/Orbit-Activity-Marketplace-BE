import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async getCategories() {
    const categories = await this.prisma.category.findMany({
      include: { children: { select: { id: true, name: true } } },
      where: { parentId: null },
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      subcategories: category.children.map((child) => ({
        id: child.id,
        name: child.name,
      })),
    }));
  }

  async create(createCategoryDto: CreateCategoryDto) {
    const existingCategory = await this.prisma.category.findFirst({
      where: {
        name: createCategoryDto.name,
        parentId: createCategoryDto.parentId ?? null,
      },
    });

    if (existingCategory)
      throw new ConflictException(
        `Category with name '${createCategoryDto.name}' already exists under the same parent`,
      );

    if (createCategoryDto.parentId) {
      const parentCategory = await this.prisma.category.findUnique({
        where: { id: createCategoryDto.parentId },
      });

      if (!parentCategory) {
        throw new NotFoundException(
          `Parent category with ID ${createCategoryDto.parentId} not found`,
        );
      }
    }

    return this.prisma.category.create({
      data: createCategoryDto,
    });
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const existingCategory = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory)
      throw new NotFoundException(`Category with ID ${id} not found`);

    if (
      updateCategoryDto.name &&
      updateCategoryDto.name !== existingCategory.name
    ) {
      const categoryWithSameName = await this.prisma.category.findFirst({
        where: {
          name: updateCategoryDto.name,
          parentId:
            updateCategoryDto.parentId !== undefined
              ? updateCategoryDto.parentId
              : existingCategory.parentId,
        },
      });

      if (categoryWithSameName)
        throw new ConflictException(
          `Category with name '${updateCategoryDto.name}' already exists under the same parent`,
        );
    }

    if (updateCategoryDto.parentId !== undefined) {
      if (updateCategoryDto.parentId === id) {
        throw new ConflictException('Category cannot be its own parent');
      }

      if (updateCategoryDto.parentId !== null) {
        const parentCategory = await this.prisma.category.findUnique({
          where: { id: updateCategoryDto.parentId },
        });

        if (!parentCategory) {
          throw new NotFoundException(
            `Parent category with ID ${updateCategoryDto.parentId} not found`,
          );
        }
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  async remove(id: number) {
    const category = await this.prisma.category.findUnique({
      include: { children: true, activities: true },
      where: { id },
    });

    if (!category)
      throw new NotFoundException(`Category with ID ${id} not found`);

    if (category.children.length > 0)
      throw new ConflictException(
        `Cannot delete category '${category.name}' because it has subcategories. Please delete subcategories first.`,
      );

    if (category.activities.length > 0)
      throw new ConflictException(
        `Cannot delete category '${category.name}' because it has associated activities. Please reassign or delete activities first.`,
      );

    await this.prisma.category.delete({ where: { id } });

    return { message: `Category '${category.name}' deleted successfully` };
  }
}
