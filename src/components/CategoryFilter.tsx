import { Category } from '@/types';
import { categories } from '@/data/mockData';
import { Wrench, Zap, Dumbbell, Tent, Cpu, Sofa, MoreHorizontal, LayoutGrid } from 'lucide-react';

const categoryIcons: Record<Category, React.ElementType> = {
  'ทั้งหมด': LayoutGrid,
  'เครื่องมือช่าง': Wrench,
  'เครื่องใช้ไฟฟ้า': Zap,
  'กีฬา': Dumbbell,
  'แคมป์ปิ้ง': Tent,
  'อิเล็กทรอนิกส์': Cpu,
  'เฟอร์นิเจอร์': Sofa,
  'อื่นๆ': MoreHorizontal,
};

interface CategoryFilterProps {
  selected: string;
  onSelect: (cat: string) => void;
  options?: { value: string; label: string }[];
}

const CategoryFilter = ({ selected, onSelect, options = categories.map(cat => ({ value: cat, label: cat })) }: CategoryFilterProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
      {options.map((cat) => {
        const Icon = categoryIcons[cat.label as Category] || MoreHorizontal;
        const isActive = selected === cat.value;
        return (
          <button
            key={cat.value}
            onClick={() => onSelect(cat.value)}
            aria-pressed={isActive}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {cat.label}
          </button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;
