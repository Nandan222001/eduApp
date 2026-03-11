import React, { useState, useEffect } from 'react';
import { Box, TextField, InputAdornment, IconButton, Autocomplete, Chip } from '@mui/material';
import { Search, FilterList, Clear } from '@mui/icons-material';
import studyMaterialsApi, { AutocompleteResponse } from '../../api/studyMaterials';
import { debounce } from 'lodash';

interface MaterialSearchBarProps {
  onSearch: (query: string) => void;
  onFilterClick?: () => void;
}

const MaterialSearchBar: React.FC<MaterialSearchBarProps> = ({ onSearch, onFilterClick }) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<AutocompleteResponse>({
    suggestions: [],
    tags: [],
    subjects: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSuggestions = debounce(async (query: string) => {
      if (query.length < 2) {
        setSuggestions({ suggestions: [], tags: [], subjects: [] });
        return;
      }

      setLoading(true);
      try {
        const response = await studyMaterialsApi.getAutocomplete(query);
        setSuggestions(response);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    fetchSuggestions(inputValue);

    return () => {
      fetchSuggestions.cancel();
    };
  }, [inputValue]);

  const handleSearch = (value: string) => {
    onSearch(value);
  };

  const handleClear = () => {
    setInputValue('');
    onSearch('');
  };

  const allOptions = [
    ...suggestions.suggestions.map((s) => ({ type: 'title', value: s })),
    ...suggestions.tags.map((t) => ({ type: 'tag', value: t })),
    ...suggestions.subjects.map((s) => ({ type: 'subject', value: s.name, id: s.id })),
  ];

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <Autocomplete
        freeSolo
        fullWidth
        options={allOptions}
        loading={loading}
        inputValue={inputValue}
        onInputChange={(_, newValue) => {
          setInputValue(newValue);
        }}
        onChange={(_, value) => {
          if (typeof value === 'string') {
            handleSearch(value);
          } else if (value && 'value' in value) {
            handleSearch(value.value);
          }
        }}
        groupBy={(option) => {
          if ('type' in option) {
            if (option.type === 'title') return 'Materials';
            if (option.type === 'tag') return 'Tags';
            if (option.type === 'subject') return 'Subjects';
          }
          return '';
        }}
        getOptionLabel={(option) => {
          if (typeof option === 'string') return option;
          if ('value' in option) return option.value;
          return '';
        }}
        renderOption={(props, option) => (
          <li {...props}>
            {typeof option === 'string' ? (
              option
            ) : (
              <Box sx={{ width: '100%' }}>
                {'type' in option && option.type === 'tag' ? (
                  <Chip label={option.value} size="small" />
                ) : (
                  option.value
                )}
              </Box>
            )}
          </li>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Search materials, tags, subjects..."
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: (
                <>
                  {inputValue && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={handleClear}>
                        <Clear />
                      </IconButton>
                    </InputAdornment>
                  )}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
      {onFilterClick && (
        <IconButton onClick={onFilterClick} color="primary">
          <FilterList />
        </IconButton>
      )}
    </Box>
  );
};

export default MaterialSearchBar;
