import React, { useState } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem,
  Chip,
  InputAdornment,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { libraryApi } from '../../api/library';
import { Book, BookCategory } from '../../types/library';

const BOOK_STATUS = ['available', 'issued', 'damaged', 'lost', 'maintenance'];

const BookCatalog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: booksData } = useQuery({
    queryKey: ['books', searchQuery],
    queryFn: () => libraryApi.listBooks({ search: searchQuery }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['bookCategories'],
    queryFn: () => libraryApi.listCategories(),
  });

  const createMutation = useMutation({
    mutationFn: libraryApi.createBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      handleClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Book> }) =>
      libraryApi.updateBook(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: libraryApi.deleteBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });

  const handleOpen = (book?: Book) => {
    setEditingBook(book || null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingBook(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = {
      institution_id: 1,
      category_id: formData.get('category_id')
        ? parseInt(formData.get('category_id') as string)
        : null,
      title: formData.get('title'),
      author: formData.get('author'),
      isbn: formData.get('isbn'),
      publisher: formData.get('publisher'),
      publication_year: formData.get('publication_year')
        ? parseInt(formData.get('publication_year') as string)
        : null,
      edition: formData.get('edition'),
      accession_number: formData.get('accession_number'),
      call_number: formData.get('call_number'),
      total_copies: parseInt(formData.get('total_copies') as string),
      available_copies: parseInt(formData.get('available_copies') as string),
      description: formData.get('description'),
      language: formData.get('language'),
      pages: formData.get('pages') ? parseInt(formData.get('pages') as string) : null,
      price: formData.get('price') ? parseFloat(formData.get('price') as string) : null,
      location: formData.get('location'),
      rack_number: formData.get('rack_number'),
      status: formData.get('status'),
      is_reference_only: formData.get('is_reference_only') === 'on',
      is_active: true,
    };

    if (editingBook) {
      updateMutation.mutate({ id: editingBook.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this book?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <TextField
          placeholder="Search books..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 300 }}
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Add Book
        </Button>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Author</TableCell>
              <TableCell>ISBN</TableCell>
              <TableCell>Accession No.</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Copies</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {booksData?.items?.map((book: Book) => (
              <TableRow key={book.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      src={book.cover_image_url}
                      alt={book.title}
                      variant="square"
                      sx={{ width: 40, height: 50 }}
                    >
                      📚
                    </Avatar>
                    <Box>
                      <div>{book.title}</div>
                      {book.is_reference_only && (
                        <Chip label="Reference Only" size="small" color="info" sx={{ mt: 0.5 }} />
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{book.author || 'N/A'}</TableCell>
                <TableCell>{book.isbn || 'N/A'}</TableCell>
                <TableCell>{book.accession_number}</TableCell>
                <TableCell>
                  <Chip label={book.category_id || 'Uncategorized'} size="small" />
                </TableCell>
                <TableCell>
                  {book.available_copies}/{book.total_copies}
                </TableCell>
                <TableCell>
                  <Chip
                    label={book.status}
                    size="small"
                    color={book.status === 'available' ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(book)} size="small">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(book.id)} size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editingBook ? 'Edit Book' : 'Add Book'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  name="title"
                  defaultValue={editingBook?.title}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Author"
                  name="author"
                  defaultValue={editingBook?.author}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="ISBN" name="isbn" defaultValue={editingBook?.isbn} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Publisher"
                  name="publisher"
                  defaultValue={editingBook?.publisher}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Publication Year"
                  name="publication_year"
                  type="number"
                  defaultValue={editingBook?.publication_year}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Edition"
                  name="edition"
                  defaultValue={editingBook?.edition}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Category"
                  name="category_id"
                  defaultValue={editingBook?.category_id}
                >
                  {categoriesData?.items?.map((cat: BookCategory) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Accession Number"
                  name="accession_number"
                  defaultValue={editingBook?.accession_number}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Call Number"
                  name="call_number"
                  defaultValue={editingBook?.call_number}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Total Copies"
                  name="total_copies"
                  type="number"
                  defaultValue={editingBook?.total_copies || 1}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Available Copies"
                  name="available_copies"
                  type="number"
                  defaultValue={editingBook?.available_copies || 1}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Language"
                  name="language"
                  defaultValue={editingBook?.language}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Pages"
                  name="pages"
                  type="number"
                  defaultValue={editingBook?.pages}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Price"
                  name="price"
                  type="number"
                  defaultValue={editingBook?.price}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  defaultValue={editingBook?.location}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Rack Number"
                  name="rack_number"
                  defaultValue={editingBook?.rack_number}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Status"
                  name="status"
                  defaultValue={editingBook?.status || 'available'}
                  required
                >
                  {BOOK_STATUS.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  multiline
                  rows={2}
                  defaultValue={editingBook?.description}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingBook ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default BookCatalog;
