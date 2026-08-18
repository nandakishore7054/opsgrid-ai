import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Search, ArrowUpDown, 
  ArrowDown, ArrowUp, FolderSearch 
} from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';
import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';
import { cn } from './utils';

export function DataTable({
  columns,
  data = [],
  loading = false,
  
  // Search
  searchable = false,
  searchValue,
  onSearchChange,
  
  // Pagination
  pagination = false,
  page,
  totalPages,
  onPageChange,
  pageSize = 10,
  
  // Empty State
  emptyIcon = FolderSearch,
  emptyTitle = "No data found",
  emptyDescription = "There are no records matching your criteria.",
  emptyPrimaryAction,
  emptySecondaryAction,
  
  // Row interaction
  onRowClick,
  selectable = false, // Future-ready prop for bulk selection
  
  // Top actions (filters etc.)
  actions,
  
  className
}) {
  // Detect controlled mode
  const isServerSearch = searchValue !== undefined && onSearchChange !== undefined;
  const isServerPagination = page !== undefined && totalPages !== undefined && onPageChange !== undefined;

  // Internal state for client-side mode
  const [internalSearch, setInternalSearch] = useState('');
  const [internalPage, setInternalPage] = useState(1);
  const [sortConfig, setSortConfig] = useState(null);

  // Handlers
  const handleSearch = (e) => {
    const val = e.target.value;
    if (isServerSearch) {
      onSearchChange(val);
    } else {
      setInternalSearch(val);
      setInternalPage(1); // Reset page on client search
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Process data (Client-side)
  const processedData = useMemo(() => {
    let result = [...data];

    // Client-side search
    if (searchable && !isServerSearch && internalSearch) {
      const lowerQuery = internalSearch.toLowerCase();
      result = result.filter(row => {
        return Object.values(row).some(val => 
          String(val).toLowerCase().includes(lowerQuery)
        );
      });
    }

    // Client-side sort
    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchable, isServerSearch, internalSearch, sortConfig]);

  // Compute pagination
  const currentTotalPages = isServerPagination 
    ? totalPages 
    : Math.ceil(processedData.length / pageSize) || 1;
    
  const currentPage = isServerPagination ? page : internalPage;

  // Paginated Data slice
  const currentData = isServerPagination 
    ? processedData // If server pagination, data is already sliced
    : processedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > currentTotalPages) return;
    if (isServerPagination) {
      onPageChange(newPage);
    } else {
      setInternalPage(newPage);
    }
  };

  return (
    <div className={cn("flex flex-col w-full bg-background rounded-xl border border-border/50 shadow-sm overflow-hidden", className)}>
      
      {/* Toolbar */}
      {(searchable || actions) && (
        <div className="p-4 border-b border-border/50 bg-surface-muted/30 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-20">
          <div className="flex-1 w-full md:max-w-md relative">
            {searchable && (
              <>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  type="text"
                  placeholder="Search..."
                  value={isServerSearch ? searchValue : internalSearch}
                  onChange={handleSearch}
                  className="pl-9 h-10 w-full"
                />
              </>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-3 w-full md:w-auto">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Table Container */}
      <div className="flex-1 overflow-x-auto relative min-h-[300px]">
        {loading && data.length === 0 ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-4 p-4 border border-border/50 rounded-xl bg-surface/50">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-8 w-24 rounded-lg hidden sm:block shrink-0" />
              </div>
            ))}
          </div>
        ) : currentData.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <EmptyState
              icon={emptyIcon}
              title={emptyTitle}
              description={emptyDescription}
              action={emptyPrimaryAction}
              secondaryAction={emptySecondaryAction}
            />
          </div>
        ) : (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface-muted/30 text-xs uppercase text-muted-foreground font-semibold sticky top-0 z-10 border-b border-border/50">
              <tr>
                {selectable && (
                  <th className="px-6 py-4 w-12 text-center">
                    <input type="checkbox" disabled className="rounded border-muted-foreground/30 text-primary focus:ring-primary" />
                  </th>
                )}
                {columns.map((col, idx) => (
                  <th 
                    key={col.key || idx} 
                    className={cn(
                      "px-6 py-4 tracking-wider", 
                      col.sortable !== false ? "cursor-pointer hover:text-foreground transition-colors select-none" : "",
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    )}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                  >
                    <div className={cn(
                      "flex items-center gap-2 inline-flex",
                      col.align === 'right' ? 'flex-row-reverse' : ''
                    )}>
                      {col.label}
                      {col.sortable !== false && (
                        <span className="text-muted-foreground/50">
                          {sortConfig?.key === col.key ? (
                            sortConfig.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-primary" /> : <ArrowDown className="w-3.5 h-3.5 text-primary" />
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 bg-background">
              <AnimatePresence initial={false}>
                {currentData.map((row, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                    key={row._id || row.id || idx}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={cn(
                      "group transition-colors",
                      onRowClick ? "cursor-pointer hover:bg-surface-muted/50 active:bg-surface-muted" : "hover:bg-surface-muted/30"
                    )}
                  >
                    {selectable && (
                      <td className="px-6 py-4 w-12 text-center" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" disabled className="rounded border-border/50 text-primary focus:ring-primary opacity-50" />
                      </td>
                    )}
                    {columns.map((col, colIdx) => (
                      <td 
                        key={col.key || colIdx} 
                        className={cn(
                          "px-6 py-4",
                          col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                          col.className
                        )}
                      >
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {pagination && currentTotalPages > 1 && (
        <div className="p-4 border-t border-border/50 bg-surface-muted/30 flex items-center justify-between mt-auto">
          <span className="text-sm text-muted-foreground font-medium hidden sm:block">
            Showing page {currentPage} of {currentTotalPages}
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <Button 
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || loading}
              onClick={() => handlePageChange(currentPage - 1)}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </Button>
            <span className="text-sm text-foreground font-medium sm:hidden">
              {currentPage} / {currentTotalPages}
            </span>
            <Button 
              variant="outline"
              size="sm"
              disabled={currentPage >= currentTotalPages || loading}
              onClick={() => handlePageChange(currentPage + 1)}
              className="gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
