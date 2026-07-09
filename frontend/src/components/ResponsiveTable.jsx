export default function ResponsiveTable({ children, minWidth = '600px' }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ minWidth }}>
          {children}
        </table>
      </div>
    </div>
  );
}

export const thClass = 'text-left px-3 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm text-gray-500 whitespace-nowrap';
export const tdClass = 'px-3 py-2.5 sm:px-6 sm:py-3 whitespace-nowrap';
