import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Tabs,
  Tab,
  Pagination,
  Alert,
  Snackbar,
  Drawer,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import { CloudUpload, ViewModule, Bookmark, History } from '@mui/icons-material';
import MaterialHierarchyTree from '../components/studyMaterials/MaterialHierarchyTree';
import MaterialCard from '../components/studyMaterials/MaterialCard';
import MaterialUploadForm from '../components/studyMaterials/MaterialUploadForm';
import MaterialSearchBar from '../components/studyMaterials/MaterialSearchBar';
import MaterialFilterDialog from '../components/studyMaterials/MaterialFilterDialog';
import MaterialViewer from '../components/studyMaterials/MaterialViewer';
import MaterialShareDialog from '../components/studyMaterials/MaterialShareDialog';
import studyMaterialsApi, {
  StudyMaterial,
  MaterialSearchFilters,
  MaterialHierarchyNode,
  MaterialStats,
} from '../api/studyMaterials';
import { useAuth } from '@/hooks/useAuth';
import { isDemoUser, demoStudyMaterialsApi } from '@/api/demoDataApi';

const StudyMaterialsLibrary: React.FC = () => {
  const { user } = useAuth();
  const isDemo = isDemoUser(user?.email);
  const [tabValue, setTabValue] = useState(0);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [hierarchy, setHierarchy] = useState<MaterialHierarchyNode[]>([]);
  const [recentlyAccessed, setRecentlyAccessed] = useState<StudyMaterial[]>([]);
  const [bookmarkedMaterials, setBookmarkedMaterials] = useState<StudyMaterial[]>([]);
  const [stats, setStats] = useState<MaterialStats | null>(null);
  const [filters, setFilters] = useState<Partial<MaterialSearchFilters>>({
    page: 1,
    page_size: 20,
  });
  const [totalPages, setTotalPages] = useState(1);
  const [uploadFormOpen, setUploadFormOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [hierarchyDrawerOpen] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    loadMaterials();
    loadHierarchy();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    if (tabValue === 1) {
      loadRecentlyAccessed();
    } else if (tabValue === 2) {
      loadBookmarks();
    }
  }, [tabValue]);

  const loadMaterials = async () => {
    try {
      if (isDemo) {
        const response = await demoStudyMaterialsApi.getPreviousYearPapers({
          skip: ((filters.page || 1) - 1) * (filters.page_size || 20),
          limit: filters.page_size || 20,
        });
        setMaterials(response.items as unknown as StudyMaterial[]);
        setTotalPages(Math.ceil(response.total / (filters.page_size || 20)));
      } else {
        const response = await studyMaterialsApi.searchMaterials(filters as MaterialSearchFilters);
        setMaterials(response.materials);
        setTotalPages(response.total_pages);
      }
    } catch (error) {
      showSnackbar('Failed to load materials', 'error');
    }
  };

  const loadHierarchy = async () => {
    if (isDemo) {
      return;
    }
    try {
      const data = await studyMaterialsApi.getHierarchy();
      setHierarchy(data);
    } catch (error) {
      console.error('Failed to load hierarchy:', error);
    }
  };

  const loadRecentlyAccessed = async () => {
    if (isDemo) {
      return;
    }
    try {
      const data = await studyMaterialsApi.getRecentlyAccessed(10);
      setRecentlyAccessed(data);
    } catch (error) {
      console.error('Failed to load recently accessed:', error);
    }
  };

  const loadBookmarks = async () => {
    if (isDemo) {
      return;
    }
    try {
      const bookmarks = await studyMaterialsApi.getMyBookmarks(false);
      setBookmarkedMaterials(bookmarks.map((b) => b.material!).filter(Boolean));
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    }
  };

  const loadStats = async () => {
    if (isDemo) {
      setStats({
        total_materials: 45,
        total_views: 1234,
        total_downloads: 567,
        bookmarked_count: 12,
      });
      return;
    }
    try {
      const data = await studyMaterialsApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSearch = (query: string) => {
    setFilters({ ...filters, query, page: 1 });
  };

  const handleFilterApply = (newFilters: Partial<MaterialSearchFilters>) => {
    setFilters({ ...filters, ...newFilters, page: 1 });
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setFilters({ ...filters, page });
  };

  const handleViewMaterial = async (material: StudyMaterial) => {
    setSelectedMaterial(material);
    setViewerOpen(true);
    if (!isDemo) {
      await studyMaterialsApi.viewMaterial(material.id);
      loadMaterials();
    }
  };

  const handleDownloadMaterial = async (material: StudyMaterial) => {
    try {
      if (isDemo) {
        showSnackbar('Download started', 'success');
        return;
      }
      const response = await studyMaterialsApi.downloadMaterial(material.id);
      window.open(response.download_url, '_blank');
      showSnackbar('Download started', 'success');
      loadMaterials();
    } catch (error) {
      showSnackbar('Failed to download material', 'error');
    }
  };

  const handleBookmark = async (material: StudyMaterial) => {
    if (isDemo) {
      showSnackbar(material.is_bookmarked ? 'Bookmark removed' : 'Material bookmarked', 'success');
      return;
    }
    try {
      if (material.is_bookmarked) {
        await studyMaterialsApi.deleteBookmark(material.id);
        showSnackbar('Bookmark removed', 'success');
      } else {
        await studyMaterialsApi.createBookmark({
          material_id: material.id,
          is_favorite: false,
        });
        showSnackbar('Material bookmarked', 'success');
      }
      loadMaterials();
      loadStats();
    } catch (error) {
      showSnackbar('Failed to update bookmark', 'error');
    }
  };

  const handleFavorite = async (material: StudyMaterial) => {
    if (isDemo) {
      showSnackbar(
        material.is_favorite ? 'Removed from favorites' : 'Added to favorites',
        'success'
      );
      return;
    }
    try {
      if (material.is_bookmarked) {
        await studyMaterialsApi.updateBookmark(material.id, {
          is_favorite: !material.is_favorite,
        });
      } else {
        await studyMaterialsApi.createBookmark({
          material_id: material.id,
          is_favorite: true,
        });
      }
      showSnackbar(
        material.is_favorite ? 'Removed from favorites' : 'Added to favorites',
        'success'
      );
      loadMaterials();
      loadStats();
    } catch (error) {
      showSnackbar('Failed to update favorite', 'error');
    }
  };

  const handleShare = (material: StudyMaterial) => {
    setSelectedMaterial(material);
    setShareDialogOpen(true);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const renderMaterialGrid = (materialsToRender: StudyMaterial[]) => (
    <Grid container spacing={3}>
      {materialsToRender.map((material) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={material.id}>
          <MaterialCard
            material={material}
            onView={() => handleViewMaterial(material)}
            onDownload={() => handleDownloadMaterial(material)}
            onBookmark={() => handleBookmark(material)}
            onFavorite={() => handleFavorite(material)}
            onShare={() => handleShare(material)}
          />
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Study Materials Library
        </Typography>
        <Button
          variant="contained"
          startIcon={<CloudUpload />}
          onClick={() => setUploadFormOpen(true)}
        >
          Upload Material
        </Button>
      </Box>

      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Materials
                </Typography>
                <Typography variant="h4">{stats.total_materials}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Views
                </Typography>
                <Typography variant="h4">{stats.total_views}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Downloads
                </Typography>
                <Typography variant="h4">{stats.total_downloads}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Bookmarked
                </Typography>
                <Typography variant="h4">{stats.bookmarked_count}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Drawer
          variant="persistent"
          anchor="left"
          open={hierarchyDrawerOpen}
          sx={{
            width: 280,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 280,
              position: 'relative',
              height: 'auto',
            },
          }}
        >
          <Paper sx={{ height: '100%', overflow: 'auto' }}>
            <MaterialHierarchyTree
              nodes={hierarchy}
              onNodeSelect={(node) => {
                if (node.type === 'subject') {
                  setFilters({ ...filters, subject_id: node.id, page: 1 });
                } else if (node.type === 'chapter') {
                  setFilters({ ...filters, chapter_id: node.id, page: 1 });
                } else if (node.type === 'topic') {
                  setFilters({ ...filters, topic_id: node.id, page: 1 });
                }
              }}
            />
          </Paper>
        </Drawer>

        <Box sx={{ flexGrow: 1 }}>
          <Paper sx={{ mb: 2, p: 2 }}>
            <MaterialSearchBar
              onSearch={handleSearch}
              onFilterClick={() => setFilterDialogOpen(true)}
            />
          </Paper>

          <Paper>
            <Tabs value={tabValue} onChange={(_, val) => setTabValue(val)}>
              <Tab icon={<ViewModule />} label="All Materials" />
              <Tab icon={<History />} label="Recently Accessed" />
              <Tab icon={<Bookmark />} label="Bookmarks" />
            </Tabs>

            <Divider />

            <Box sx={{ p: 3 }}>
              {tabValue === 0 && (
                <>
                  {renderMaterialGrid(materials)}
                  {totalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                      <Pagination
                        count={totalPages}
                        page={filters.page || 1}
                        onChange={handlePageChange}
                        color="primary"
                      />
                    </Box>
                  )}
                </>
              )}

              {tabValue === 1 && (
                <>
                  {recentlyAccessed.length > 0 ? (
                    renderMaterialGrid(recentlyAccessed)
                  ) : (
                    <Alert severity="info">No recently accessed materials</Alert>
                  )}
                </>
              )}

              {tabValue === 2 && (
                <>
                  {bookmarkedMaterials.length > 0 ? (
                    renderMaterialGrid(bookmarkedMaterials)
                  ) : (
                    <Alert severity="info">No bookmarked materials</Alert>
                  )}
                </>
              )}
            </Box>
          </Paper>
        </Box>
      </Box>

      <MaterialUploadForm
        open={uploadFormOpen}
        onClose={() => setUploadFormOpen(false)}
        onSuccess={() => {
          loadMaterials();
          loadHierarchy();
          loadStats();
          showSnackbar('Material uploaded successfully', 'success');
        }}
      />

      <MaterialFilterDialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        onApply={handleFilterApply}
        currentFilters={filters}
      />

      {selectedMaterial && (
        <>
          <MaterialViewer
            open={viewerOpen}
            material={selectedMaterial}
            onClose={() => setViewerOpen(false)}
            onDownload={() => handleDownloadMaterial(selectedMaterial)}
            onShare={() => handleShare(selectedMaterial)}
            onBookmark={() => handleBookmark(selectedMaterial)}
            onFavorite={() => handleFavorite(selectedMaterial)}
          />

          <MaterialShareDialog
            open={shareDialogOpen}
            onClose={() => setShareDialogOpen(false)}
            materialId={selectedMaterial.id}
            materialTitle={selectedMaterial.title}
          />
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default StudyMaterialsLibrary;
