import { useState, useEffect, useRef } from 'react';
import {
  TextField,
  InputAdornment,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  CircularProgress,
  Chip,
  IconButton,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  TrendingUp as TrendingIcon,
  Close as CloseIcon,
  ArrowForward as ArrowForwardIcon,
  School as StudentIcon,
  Person as TeacherIcon,
  Assignment as AssignmentIcon,
  Description as PaperIcon,
  Announcement as AnnouncementIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { searchApi, QuickSearchResult } from '@/api/search';
import { useDebounce } from '@/hooks/useDebounce';

interface GlobalSearchBarProps {
  onClose?: () => void;
  fullWidth?: boolean;
}

const typeIcons = {
  student: StudentIcon,
  teacher: TeacherIcon,
  assignment: AssignmentIcon,
  paper: PaperIcon,
  announcement: AnnouncementIcon,
};

const typeColors = {
  student: '#1976d2',
  teacher: '#2e7d32',
  assignment: '#ed6c02',
  paper: '#9c27b0',
  announcement: '#d32f2f',
};

export default function GlobalSearchBar({ onClose, fullWidth = false }: GlobalSearchBarProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<QuickSearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<{ query: string; type: string; count?: number }[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (debouncedQuery.trim().length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const [searchResults, suggestionsData] = await Promise.all([
          searchApi.quickSearch(debouncedQuery, 10),
          searchApi.getSearchSuggestions(debouncedQuery, 5),
        ]);
        setResults(searchResults.results);
        setSuggestions(suggestionsData.suggestions);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    if (debouncedQuery) {
      performSearch();
    }
  }, [debouncedQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setShowDropdown(true);
    setSelectedIndex(-1);
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  const handleResultClick = (result: QuickSearchResult) => {
    navigate(result.url);
    setQuery('');
    setShowDropdown(false);
    onClose?.();
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowDropdown(false);
      onClose?.();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0 && results[selectedIndex]) {
      handleResultClick(results[selectedIndex]);
    } else if (e.key === 'Enter' && query.trim()) {
      navigate(`/admin/search?q=${encodeURIComponent(query)}`);
      setShowDropdown(false);
      onClose?.();
    }
  };

  const getTypeIcon = (type: string) => {
    const IconComponent = typeIcons[type as keyof typeof typeIcons] || SearchIcon;
    return <IconComponent />;
  };

  return (
    <Box sx={{ position: 'relative', width: fullWidth ? '100%' : { xs: '100%', sm: 400 } }}>
      <TextField
        inputRef={inputRef}
        fullWidth
        size="small"
        placeholder="Search... (⌘K)"
        value={query}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {loading ? <CircularProgress size={20} /> : <SearchIcon />}
            </InputAdornment>
          ),
          endAdornment: query && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={handleClear}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            bgcolor: alpha(theme.palette.common.white, 0.15),
            '&:hover': {
              bgcolor: alpha(theme.palette.common.white, 0.2),
            },
            '&.Mui-focused': {
              bgcolor: theme.palette.background.paper,
            },
          },
        }}
      />

      {showDropdown && (query || suggestions.length > 0) && (
        <Paper
          ref={dropdownRef}
          elevation={8}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 1,
            maxHeight: 500,
            overflow: 'auto',
            zIndex: theme.zIndex.modal,
            borderRadius: 2,
          }}
        >
          {!query && suggestions.length > 0 && (
            <Box sx={{ p: 2 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                <TrendingIcon fontSize="small" />
                Popular Searches
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {suggestions.map((suggestion, idx) => (
                  <Chip
                    key={idx}
                    label={suggestion.query}
                    size="small"
                    onClick={() => {
                      setQuery(suggestion.query);
                      inputRef.current?.focus();
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {query && results.length === 0 && !loading && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No results found for &quot;{query}&quot;
              </Typography>
            </Box>
          )}

          {results.length > 0 && (
            <List sx={{ py: 0 }}>
              {results.map((result, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <ListItem
                    key={`${result.type}-${result.id}`}
                    button
                    selected={isSelected}
                    onClick={() => handleResultClick(result)}
                    sx={{
                      borderLeft: isSelected
                        ? `3px solid ${theme.palette.primary.main}`
                        : '3px solid transparent',
                      bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: alpha(
                            typeColors[result.type as keyof typeof typeColors] ||
                              theme.palette.primary.main,
                            0.1
                          ),
                          color:
                            typeColors[result.type as keyof typeof typeColors] ||
                            theme.palette.primary.main,
                        }}
                      >
                        {getTypeIcon(result.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight={500}>
                            {result.title}
                          </Typography>
                          <Chip
                            label={result.type}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              bgcolor: alpha(
                                typeColors[result.type as keyof typeof typeColors] ||
                                  theme.palette.primary.main,
                                0.1
                              ),
                              color:
                                typeColors[result.type as keyof typeof typeColors] ||
                                theme.palette.primary.main,
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {result.subtitle}
                        </Typography>
                      }
                    />
                    <ArrowForwardIcon fontSize="small" color="action" />
                  </ListItem>
                );
              })}
            </List>
          )}

          {query && results.length > 0 && (
            <>
              <Divider />
              <Box
                sx={{
                  p: 1.5,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                }}
                onClick={() => {
                  navigate(`/admin/search?q=${encodeURIComponent(query)}`);
                  setShowDropdown(false);
                  onClose?.();
                }}
              >
                <Typography
                  variant="body2"
                  color="primary"
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}
                >
                  View all results
                  <ArrowForwardIcon fontSize="small" />
                </Typography>
              </Box>
            </>
          )}
        </Paper>
      )}
    </Box>
  );
}
