import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  Container,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Breadcrumbs,
  Link,
  Stack,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Comment as CommentIcon,
  TrendingUp as TrendingUpIcon,
  Article as ArticleIcon,
  CalendarToday as CalendarIcon,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  Link as LinkIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';

interface Article {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  author: {
    name: string;
    avatar?: string;
    role: string;
  };
  category: 'news' | 'sports' | 'opinion' | 'arts';
  publishedDate: string;
  coverImage?: string;
  tags: string[];
  readTime: number;
  views: number;
  comments: number;
  featured: boolean;
}

interface Edition {
  id: number;
  title: string;
  coverImage: string;
  publishDate: string;
  description: string;
  articleCount: number;
}

const mockEditions: Edition[] = [
  {
    id: 1,
    title: 'Spring 2024 Edition',
    coverImage: 'https://via.placeholder.com/400x600/1976d2/ffffff?text=Spring+2024',
    publishDate: '2024-03-15',
    description: 'Celebrating achievements and spring events',
    articleCount: 12,
  },
  {
    id: 2,
    title: 'Winter 2024 Edition',
    coverImage: 'https://via.placeholder.com/400x600/0d47a1/ffffff?text=Winter+2024',
    publishDate: '2024-01-10',
    description: 'Year-end reflections and winter sports highlights',
    articleCount: 15,
  },
];

const mockArticles: Article[] = [
  {
    id: 1,
    title: 'School Wins State Championship in Debate Competition',
    excerpt:
      'Our debate team brought home the trophy after a nail-biting final round against five other schools.',
    content:
      'The school debate team made history last weekend by winning the state championship...',
    author: { name: 'Sarah Johnson', avatar: '', role: 'Editor-in-Chief' },
    category: 'news',
    publishedDate: '2024-03-10',
    coverImage: 'https://via.placeholder.com/800x400/1976d2/ffffff?text=Debate+Victory',
    tags: ['debate', 'achievement', 'championship'],
    readTime: 5,
    views: 1250,
    comments: 23,
    featured: true,
  },
  {
    id: 2,
    title: 'Basketball Team Advances to Regional Finals',
    excerpt: 'After an impressive season, our basketball team is heading to the regional finals.',
    content: 'The basketball team has shown remarkable improvement this season...',
    author: { name: 'Mike Chen', avatar: '', role: 'Sports Editor' },
    category: 'sports',
    publishedDate: '2024-03-08',
    coverImage: 'https://via.placeholder.com/800x400/2e7d32/ffffff?text=Basketball',
    tags: ['basketball', 'sports', 'playoffs'],
    readTime: 4,
    views: 890,
    comments: 15,
    featured: true,
  },
  {
    id: 3,
    title: 'The Importance of Mental Health Awareness',
    excerpt:
      'In our fast-paced academic environment, taking care of our mental health is more important than ever.',
    content: 'Mental health awareness has become a critical topic in schools...',
    author: { name: 'Emily Rodriguez', avatar: '', role: 'Opinion Writer' },
    category: 'opinion',
    publishedDate: '2024-03-05',
    tags: ['mental health', 'wellness', 'opinion'],
    readTime: 6,
    views: 1500,
    comments: 42,
    featured: false,
  },
  {
    id: 4,
    title: 'Student Art Exhibition Showcases Creative Talent',
    excerpt: 'The annual art exhibition features stunning works from over 50 student artists.',
    content: 'This years art exhibition exceeded all expectations...',
    author: { name: 'David Kim', avatar: '', role: 'Arts Correspondent' },
    category: 'arts',
    publishedDate: '2024-03-03',
    coverImage: 'https://via.placeholder.com/800x400/6a1b9a/ffffff?text=Art+Exhibition',
    tags: ['art', 'exhibition', 'creativity'],
    readTime: 5,
    views: 720,
    comments: 18,
    featured: false,
  },
];

const mockComments = [
  {
    id: 1,
    author: 'John Doe',
    avatar: '',
    content: 'Great article! Really proud of our debate team.',
    timestamp: '2024-03-10T14:30:00',
  },
  {
    id: 2,
    author: 'Jane Smith',
    avatar: '',
    content: 'This is such an inspiring achievement. Congratulations to everyone involved!',
    timestamp: '2024-03-10T15:45:00',
  },
];

const relatedArticles = [
  { id: 5, title: 'Debate Team Prepares for Nationals', category: 'news' },
  { id: 6, title: 'Interview with Debate Coach', category: 'news' },
  { id: 7, title: 'History of Our Debate Program', category: 'news' },
];

export default function StudentNewspaper() {
  const theme = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [bookmarkedArticles, setBookmarkedArticles] = useState<Set<number>>(new Set());
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const categories = [
    { value: 'all', label: 'All Stories' },
    { value: 'news', label: 'News' },
    { value: 'sports', label: 'Sports' },
    { value: 'opinion', label: 'Opinion' },
    { value: 'arts', label: 'Arts' },
  ];

  const filteredArticles = mockArticles.filter((article) => {
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredArticles = filteredArticles.filter((a) => a.featured);
  const regularArticles = filteredArticles.filter((a) => !a.featured);

  const handleBookmark = (articleId: number) => {
    setBookmarkedArticles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(articleId)) {
        newSet.delete(articleId);
      } else {
        newSet.add(articleId);
      }
      return newSet;
    });
  };

  const handleShare = (platform: string) => {
    console.log(`Sharing to ${platform}`);
    setShareDialogOpen(false);
  };

  if (selectedArticle) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
          <Link
            color="inherit"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setSelectedArticle(null);
            }}
            sx={{ cursor: 'pointer' }}
          >
            Newspaper
          </Link>
          <Typography color="text.primary">{selectedArticle.category}</Typography>
        </Breadcrumbs>

        <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, p: 4 }}>
          <Stack spacing={3}>
            <Box>
              <Chip label={selectedArticle.category.toUpperCase()} color="primary" sx={{ mb: 2 }} />
              <Typography variant="h3" component="h1" gutterBottom fontWeight={700}>
                {selectedArticle.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar src={selectedArticle.author.avatar}>
                  {selectedArticle.author.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedArticle.author.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedArticle.author.role} • {selectedArticle.publishedDate} •{' '}
                    {selectedArticle.readTime} min read
                  </Typography>
                </Box>
              </Box>
            </Box>

            {selectedArticle.coverImage && (
              <Box
                component="img"
                src={selectedArticle.coverImage}
                alt={selectedArticle.title}
                sx={{ width: '100%', borderRadius: 2, maxHeight: 500, objectFit: 'cover' }}
              />
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                startIcon={
                  bookmarkedArticles.has(selectedArticle.id) ? (
                    <BookmarkIcon />
                  ) : (
                    <BookmarkBorderIcon />
                  )
                }
                onClick={() => handleBookmark(selectedArticle.id)}
              >
                {bookmarkedArticles.has(selectedArticle.id) ? 'Saved' : 'Save'}
              </Button>
              <Button startIcon={<ShareIcon />} onClick={() => setShareDialogOpen(true)}>
                Share
              </Button>
            </Box>

            <Divider />

            <Typography variant="body1" sx={{ lineHeight: 1.8, fontSize: '1.125rem' }}>
              {selectedArticle.content}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {selectedArticle.tags.map((tag) => (
                <Chip key={tag} label={`#${tag}`} size="small" variant="outlined" />
              ))}
            </Box>

            <Divider />

            <Box>
              <Typography variant="h5" gutterBottom fontWeight={600}>
                Related Articles
              </Typography>
              <List>
                {relatedArticles.map((article) => (
                  <ListItem
                    key={article.id}
                    sx={{
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 1,
                      mb: 1,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <ArticleIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={article.title}
                      secondary={article.category.toUpperCase()}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h5" gutterBottom fontWeight={600}>
                Comments ({mockComments.length})
              </Typography>
              <List>
                {mockComments.map((comment) => (
                  <ListItem key={comment.id} alignItems="flex-start" sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar src={comment.avatar}>{comment.author.charAt(0)}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body1" fontWeight={600}>
                            {comment.author}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(comment.timestamp).toLocaleDateString()}
                          </Typography>
                        </Box>
                      }
                      secondary={comment.content}
                    />
                  </ListItem>
                ))}
              </List>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Add a comment..."
                variant="outlined"
                sx={{ mt: 2 }}
              />
              <Button variant="contained" sx={{ mt: 2 }}>
                Post Comment
              </Button>
            </Box>
          </Stack>
        </Paper>

        <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)}>
          <DialogTitle>Share Article</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ minWidth: 300 }}>
              <Button
                startIcon={<FacebookIcon />}
                fullWidth
                variant="outlined"
                onClick={() => handleShare('facebook')}
              >
                Share on Facebook
              </Button>
              <Button
                startIcon={<TwitterIcon />}
                fullWidth
                variant="outlined"
                onClick={() => handleShare('twitter')}
              >
                Share on Twitter
              </Button>
              <Button
                startIcon={<LinkedInIcon />}
                fullWidth
                variant="outlined"
                onClick={() => handleShare('linkedin')}
              >
                Share on LinkedIn
              </Button>
              <Button
                startIcon={<LinkIcon />}
                fullWidth
                variant="outlined"
                onClick={() => handleShare('copy')}
              >
                Copy Link
              </Button>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShareDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom fontWeight={700}>
          Student Newspaper
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Stories by students, for students
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom fontWeight={600}>
          Latest Editions
        </Typography>
        <Grid container spacing={3}>
          {mockEditions.map((edition) => (
            <Grid item xs={12} sm={6} md={3} key={edition.id}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)' },
                }}
              >
                <CardMedia
                  component="img"
                  height="300"
                  image={edition.coverImage}
                  alt={edition.title}
                />
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    {edition.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {edition.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Chip
                      icon={<CalendarIcon />}
                      label={new Date(edition.publishDate).toLocaleDateString()}
                      size="small"
                    />
                    <Chip
                      icon={<ArticleIcon />}
                      label={`${edition.articleCount} articles`}
                      size="small"
                    />
                  </Box>
                </CardContent>
                <CardActions>
                  <Button size="small" fullWidth>
                    Read Edition
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
        <Tabs
          value={selectedCategory}
          onChange={(_, newValue) => setSelectedCategory(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {categories.map((cat) => (
            <Tab key={cat.value} label={cat.label} value={cat.value} />
          ))}
        </Tabs>
      </Box>

      {featuredArticles.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mb: 3 }}>
            Featured Stories
          </Typography>
          <Grid container spacing={3}>
            {featuredArticles.map((article) => (
              <Grid item xs={12} md={6} key={article.id}>
                <Card
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-4px)' },
                  }}
                  onClick={() => setSelectedArticle(article)}
                >
                  {article.coverImage && (
                    <CardMedia
                      component="img"
                      height="300"
                      image={article.coverImage}
                      alt={article.title}
                    />
                  )}
                  <CardContent>
                    <Chip
                      label={article.category.toUpperCase()}
                      size="small"
                      color="primary"
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="h5" gutterBottom fontWeight={700}>
                      {article.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {article.excerpt}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Avatar src={article.author.avatar} sx={{ width: 32, height: 32 }}>
                        {article.author.name.charAt(0)}
                      </Avatar>
                      <Typography variant="body2">
                        {article.author.name} • {article.readTime} min read
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Chip
                        icon={<TrendingUpIcon />}
                        label={`${article.views} views`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        icon={<CommentIcon />}
                        label={`${article.comments}`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookmark(article.id);
                      }}
                    >
                      {bookmarkedArticles.has(article.id) ? (
                        <BookmarkIcon />
                      ) : (
                        <BookmarkBorderIcon />
                      )}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShareDialogOpen(true);
                      }}
                    >
                      <ShareIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Box>
        <Typography variant="h5" gutterBottom fontWeight={600} sx={{ mb: 3 }}>
          All Articles
        </Typography>
        <Grid container spacing={3}>
          {regularArticles.map((article) => (
            <Grid item xs={12} sm={6} md={4} key={article.id}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)' },
                }}
                onClick={() => setSelectedArticle(article)}
              >
                {article.coverImage && (
                  <CardMedia
                    component="img"
                    height="200"
                    image={article.coverImage}
                    alt={article.title}
                  />
                )}
                <CardContent>
                  <Chip
                    label={article.category.toUpperCase()}
                    size="small"
                    color="primary"
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    {article.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {article.excerpt}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Avatar src={article.author.avatar} sx={{ width: 24, height: 24 }}>
                      {article.author.name.charAt(0)}
                    </Avatar>
                    <Typography variant="caption">{article.author.name}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {article.publishedDate} • {article.readTime} min read
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}
