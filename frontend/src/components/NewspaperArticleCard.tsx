import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Chip,
  Avatar,
  Box,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Share as ShareIcon,
  TrendingUp as TrendingUpIcon,
  Comment as CommentIcon,
} from '@mui/icons-material';

interface Article {
  id: number;
  title: string;
  excerpt: string;
  author: {
    name: string;
    avatar?: string;
  };
  category: string;
  publishedDate: string;
  coverImage?: string;
  readTime: number;
  views: number;
  comments: number;
}

interface ArticleCardProps {
  article: Article;
  variant?: 'featured' | 'compact' | 'list';
  onArticleClick?: (article: Article) => void;
  onBookmark?: (articleId: number) => void;
  onShare?: (articleId: number) => void;
  isBookmarked?: boolean;
}

export default function ArticleCard({
  article,
  variant = 'compact',
  onArticleClick,
  onBookmark,
  onShare,
  isBookmarked = false,
}: ArticleCardProps) {
  const theme = useTheme();

  const handleCardClick = () => {
    if (onArticleClick) {
      onArticleClick(article);
    }
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBookmark) {
      onBookmark(article.id);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShare) {
      onShare(article.id);
    }
  };

  if (variant === 'featured') {
    return (
      <Card
        sx={{
          height: '100%',
          cursor: 'pointer',
          transition: 'transform 0.2s',
          '&:hover': { transform: 'translateY(-4px)' },
        }}
        onClick={handleCardClick}
      >
        {article.coverImage && (
          <CardMedia component="img" height="300" image={article.coverImage} alt={article.title} />
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
          <IconButton size="small" onClick={handleBookmark}>
            {isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
          </IconButton>
          <IconButton size="small" onClick={handleShare}>
            <ShareIcon />
          </IconButton>
        </CardActions>
      </Card>
    );
  }

  if (variant === 'list') {
    return (
      <Card
        sx={{
          display: 'flex',
          cursor: 'pointer',
          mb: 2,
          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) },
        }}
        onClick={handleCardClick}
      >
        {article.coverImage && (
          <CardMedia
            component="img"
            sx={{ width: 200, display: { xs: 'none', sm: 'block' } }}
            image={article.coverImage}
            alt={article.title}
          />
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar src={article.author.avatar} sx={{ width: 24, height: 24 }}>
                {article.author.name.charAt(0)}
              </Avatar>
              <Typography variant="caption">{article.author.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                • {article.publishedDate} • {article.readTime} min read
              </Typography>
            </Box>
          </CardContent>
          <CardActions>
            <IconButton size="small" onClick={handleBookmark}>
              {isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
            </IconButton>
            <IconButton size="small" onClick={handleShare}>
              <ShareIcon />
            </IconButton>
            <Box sx={{ ml: 'auto', display: 'flex', gap: 2 }}>
              <Chip
                icon={<TrendingUpIcon />}
                label={`${article.views}`}
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
          </CardActions>
        </Box>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        height: '100%',
        cursor: 'pointer',
        transition: 'transform 0.2s',
        '&:hover': { transform: 'translateY(-4px)' },
      }}
      onClick={handleCardClick}
    >
      {article.coverImage && (
        <CardMedia component="img" height="200" image={article.coverImage} alt={article.title} />
      )}
      <CardContent>
        <Chip label={article.category.toUpperCase()} size="small" color="primary" sx={{ mb: 1 }} />
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
      <CardActions>
        <IconButton size="small" onClick={handleBookmark}>
          {isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
        </IconButton>
        <IconButton size="small" onClick={handleShare}>
          <ShareIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
}
