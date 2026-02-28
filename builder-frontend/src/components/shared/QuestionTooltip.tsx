import { createSignal, JSX } from "solid-js";
import QuestionMarkIcon from "../icon/QuestionMarkIcon";

interface TooltipProps {
  text: string;
  iconClass?: string;
  children?: JSX.Element;
}

export default function QuestionTooltip(props: TooltipProps) {
  const [isVisible, setIsVisible] = createSignal(false);
  const [position, setPosition] = createSignal<{ x: number, align: 'center' | 'left' | 'right' }>({ x: 0, align: 'center' });
  
  let containerRef: HTMLDivElement | undefined;

  const handleMouseEnter = () => {
    if (containerRef) {
      const rect = containerRef.getBoundingClientRect();
      const tooltipWidth = 256; // w-64 is 16rem = 256px
      
      // Calculate potential left and right bounds if centered
      const centerLeft = rect.left + (rect.width / 2) - (tooltipWidth / 2);
      const centerRight = centerLeft + tooltipWidth;
      
      const viewportWidth = window.innerWidth;
      const padding = 16; // 16px safety padding from screen edges

      if (centerLeft < padding) {
        // Overflow on the left: align left edge of tooltip with container
        setPosition({ x: 0, align: 'left' });
      } else if (centerRight > viewportWidth - padding) {
        // Overflow on the right: align right edge of tooltip with container
        setPosition({ x: 0, align: 'right' });
      } else {
        // Safe to center perfectly
        setPosition({ x: 0, align: 'center' });
      }
    }
    setIsVisible(true);
  };

  const handleMouseLeave = () => setIsVisible(false);

  return (
    <div
      ref={containerRef}
      class="relative inline-flex items-center justify-center cursor-help"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
      tabIndex={0}
      aria-label="More information"
    >
      {props.children ? (
        props.children
      ) : (
        <QuestionMarkIcon class={`size-5 text-gray-500 hover:text-gray-700 transition-colors ${props.iconClass || ""}`} />
      )}

      {isVisible() && (
        <div 
          class={`absolute z-50 w-64 p-3 mt-2 text-sm text-gray-800 bg-white border border-gray-200 rounded-lg shadow-lg top-full pointer-events-none fade-in ${
            position().align === 'center' ? 'left-1/2 -translate-x-1/2' :
            position().align === 'left' ? 'left-0' :
            'right-0'
          }`}
        >
          {props.text}
          {/* Decorative arrow pointing up */}
          <div 
            class={`absolute w-3 h-3 bg-white border-t border-l border-gray-200 rotate-45 -top-[7px] ${
              position().align === 'center' ? 'left-1/2 -translate-x-1/2' :
              position().align === 'left' ? 'left-3' :
              'right-3'
            }`} 
          />
        </div>
      )}
    </div>
  );
}
