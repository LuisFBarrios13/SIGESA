// Single Responsibility: floating action button

import Icon from '../ui/Icon';

interface FloatingActionButtonProps {
  icon?: string;
  label?: string;
  onClick?: () => void;
}

const FloatingActionButton = ({
  icon = 'add',
  label = 'Add',
  onClick,
}: FloatingActionButtonProps) => (
  <button
    onClick={onClick}
    aria-label={label}
    className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40"
  >
    <Icon name={icon} className="text-2xl" />
  </button>
);

export default FloatingActionButton;