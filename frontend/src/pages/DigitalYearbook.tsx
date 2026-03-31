import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Button,
  TextField,
  InputAdornment,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Chip,
  Dialog,
  DialogContent,
  Slider,
  Tooltip,
  useTheme,
  alpha,
  AppBar,
  Toolbar,
  Fab,
  Card,
  CardContent,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Search as SearchIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Home as HomeIcon,
  People as PeopleIcon,
  EmojiEvents as TrophyIcon,
  Sports as SportsIcon,
  Palette as ArtsIcon,
  School as SchoolIcon,
  Bookmark as BookmarkIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { Yearbook, YearbookPage, YearbookSection } from '@/types/yearbook';

const mockYearbook: Yearbook = {
  id: 1,
  year: '2023-2024',
  title: 'Memories Forever',
  theme: 'Journey Through Time',
  coverImage: 'https://via.placeholder.com/800x1000/1976d2/ffffff?text=Yearbook+Cover',
  totalPages: 120,
  status: 'published',
  schoolName: 'Lincoln High School',
  publishedDate: '2024-06-15',
  isPublic: true,
  sections: [
    { id: '1', name: 'Class Photos', startPage: 5, endPage: 40, icon: 'people', color: '#1976d2' },
    {
      id: '2',
      name: 'Clubs & Activities',
      startPage: 41,
      endPage: 65,
      icon: 'school',
      color: '#2e7d32',
    },
    { id: '3', name: 'Sports', startPage: 66, endPage: 85, icon: 'sports', color: '#ed6c02' },
    {
      id: '4',
      name: 'Arts & Culture',
      startPage: 86,
      endPage: 100,
      icon: 'arts',
      color: '#9c27b0',
    },
    {
      id: '5',
      name: 'Senior Memories',
      startPage: 101,
      endPage: 120,
      icon: 'trophy',
      color: '#d32f2f',
    },
  ],
};

const mockPages: YearbookPage[] = Array.from({ length: 120 }, (_, i) => ({
  id: i + 1,
  pageNumber: i + 1,
  section:
    i < 40
      ? 'Class Photos'
      : i < 65
        ? 'Clubs & Activities'
        : i < 85
          ? 'Sports'
          : i < 100
            ? 'Arts & Culture'
            : 'Senior Memories',
  layout: 'grid',
  elements: [],
  thumbnailUrl: `https://via.placeholder.com/400x500/e0e0e0/757575?text=Page+${i + 1}`,
}));

export default function DigitalYearbook() {
  const theme = useTheme();
  const [yearbook] = useState<Yearbook>(mockYearbook);
  const [pages] = useState<YearbookPage[]>(mockPages);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchResultsOpen, setSearchResultsOpen] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragStart, setDragStart] = useState<number | null>(null);

  const handleNextPage = useCallback(() => {
    if (currentPage < pages.length - 2) {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(currentPage + 2);
        setIsFlipping(false);
      }, 600);
    }
  }, [currentPage, pages.length]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 0) {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(currentPage - 2);
        setIsFlipping(false);
      }, 600);
    }
  }, [currentPage]);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrevPage();
      if (e.key === 'ArrowRight') handleNextPage();
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      if (e.key === 'Escape' && isFullscreen) toggleFullscreen();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handlePrevPage, handleNextPage, toggleFullscreen, isFullscreen]);

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 0.25, 0.5));
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setSearchResultsOpen(true);
    }
  };

  const goToPage = (pageNum: number) => {
    const adjustedPage = pageNum % 2 === 0 ? pageNum : pageNum - 1;
    setCurrentPage(Math.max(0, Math.min(adjustedPage, pages.length - 2)));
    setSidebarOpen(false);
  };

  const goToSection = (section: YearbookSection) => {
    goToPage(section.startPage);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragStart(e.clientX);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragStart !== null) {
      const dragDistance = e.clientX - dragStart;
      if (Math.abs(dragDistance) > 50) {
        if (dragDistance > 0) {
          handlePrevPage();
        } else {
          handleNextPage();
        }
      }
      setDragStart(null);
    }
  };

  const getPageTransform = (pageIndex: number) => {
    if (!isFlipping) return 'rotateY(0deg)';

    if (pageIndex === currentPage) {
      return 'rotateY(-180deg)';
    }
    return 'rotateY(0deg)';
  };

  const getSectionIcon = (iconName?: string) => {
    switch (iconName) {
      case 'people':
        return <PeopleIcon />;
      case 'school':
        return <SchoolIcon />;
      case 'sports':
        return <SportsIcon />;
      case 'arts':
        return <ArtsIcon />;
      case 'trophy':
        return <TrophyIcon />;
      default:
        return <HomeIcon />;
    }
  };

  const searchResults = pages.filter((page) =>
    page.section.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box
      ref={containerRef}
      sx={{
        height: isFullscreen ? '100vh' : 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#2c2c2c',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: alpha('#000', 0.8),
          backdropFilter: 'blur(10px)',
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setSidebarOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {yearbook.title} - {yearbook.year}
          </Typography>

          <TextField
            size="small"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'white' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              mr: 2,
              width: 250,
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': {
                  borderColor: alpha('#fff', 0.3),
                },
                '&:hover fieldset': {
                  borderColor: alpha('#fff', 0.5),
                },
              },
            }}
          />

          <Chip
            label={`Page ${currentPage + 1}-${currentPage + 2} of ${pages.length}`}
            sx={{
              bgcolor: alpha('#fff', 0.2),
              color: 'white',
              mr: 2,
            }}
          />

          <Tooltip title="Zoom Out">
            <IconButton color="inherit" onClick={handleZoomOut} disabled={zoom <= 0.5}>
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>

          <Typography variant="body2" sx={{ mx: 1, minWidth: 50, textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </Typography>

          <Tooltip title="Zoom In">
            <IconButton color="inherit" onClick={handleZoomIn} disabled={zoom >= 3}>
              <ZoomInIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
            <IconButton color="inherit" onClick={toggleFullscreen} sx={{ ml: 2 }}>
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Share">
            <IconButton color="inherit">
              <ShareIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Download">
            <IconButton color="inherit">
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          perspective: '2000px',
          overflow: 'auto',
          p: 4,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            gap: 3,
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            transition: 'transform 0.3s ease',
          }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        >
          {currentPage < pages.length && (
            <Paper
              elevation={8}
              sx={{
                width: 600,
                height: 800,
                position: 'relative',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.6s ease',
                transform: getPageTransform(currentPage),
                cursor: dragStart !== null ? 'grabbing' : 'grab',
                bgcolor: 'white',
                backgroundImage: `url(${pages[currentPage].thumbnailUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  right: 16,
                  bgcolor: alpha('#000', 0.6),
                  color: 'white',
                  px: 2,
                  py: 1,
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2">{currentPage + 1}</Typography>
              </Box>
            </Paper>
          )}

          {currentPage + 1 < pages.length && (
            <Paper
              elevation={8}
              sx={{
                width: 600,
                height: 800,
                position: 'relative',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.6s ease',
                cursor: dragStart !== null ? 'grabbing' : 'grab',
                bgcolor: 'white',
                backgroundImage: `url(${pages[currentPage + 1].thumbnailUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  right: 16,
                  bgcolor: alpha('#000', 0.6),
                  color: 'white',
                  px: 2,
                  py: 1,
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2">{currentPage + 2}</Typography>
              </Box>
            </Paper>
          )}
        </Box>

        <Fab
          color="primary"
          onClick={handlePrevPage}
          disabled={currentPage === 0}
          sx={{
            position: 'absolute',
            left: 32,
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        >
          <ChevronLeftIcon />
        </Fab>

        <Fab
          color="primary"
          onClick={handleNextPage}
          disabled={currentPage >= pages.length - 2}
          sx={{
            position: 'absolute',
            right: 32,
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        >
          <ChevronRightIcon />
        </Fab>
      </Box>

      <Box
        sx={{
          p: 2,
          bgcolor: alpha('#000', 0.8),
          backdropFilter: 'blur(10px)',
        }}
      >
        <Slider
          value={currentPage}
          onChange={(_, value) => goToPage(value as number)}
          min={0}
          max={pages.length - 2}
          step={2}
          sx={{
            color: theme.palette.primary.main,
            '& .MuiSlider-thumb': {
              width: 20,
              height: 20,
            },
          }}
        />
      </Box>

      <Drawer
        anchor="left"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        PaperProps={{
          sx: { width: 320 },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
            <Typography variant="h6">Navigation</Typography>
            <IconButton onClick={() => setSidebarOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {yearbook.schoolName}
              </Typography>
              <Typography variant="h6" gutterBottom>
                {yearbook.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {yearbook.year}
              </Typography>
            </CardContent>
          </Card>

          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Sections
          </Typography>
          <List>
            {yearbook.sections.map((section) => (
              <ListItem key={section.id} disablePadding>
                <ListItemButton onClick={() => goToSection(section)}>
                  <ListItemIcon sx={{ color: section.color }}>
                    {getSectionIcon(section.icon || 'home')}
                  </ListItemIcon>
                  <ListItemText
                    primary={section.name}
                    secondary={`Pages ${section.startPage}-${section.endPage}`}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Box sx={{ mt: 3 }}>
            <Button fullWidth variant="outlined" startIcon={<BookmarkIcon />} sx={{ mb: 1 }}>
              Bookmarks
            </Button>
            <Button fullWidth variant="outlined" startIcon={<DownloadIcon />}>
              Download PDF
            </Button>
          </Box>
        </Box>
      </Drawer>

      <Dialog
        open={searchResultsOpen}
        onClose={() => setSearchResultsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
            <Typography variant="h6">Search Results</Typography>
            <IconButton onClick={() => setSearchResultsOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <List>
            {searchResults.length > 0 ? (
              searchResults.map((page) => (
                <ListItem key={page.id} disablePadding>
                  <ListItemButton
                    onClick={() => {
                      goToPage(page.pageNumber);
                      setSearchResultsOpen(false);
                    }}
                  >
                    <ListItemText primary={`Page ${page.pageNumber}`} secondary={page.section} />
                  </ListItemButton>
                </ListItem>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                No results found
              </Typography>
            )}
          </List>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
