import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import otaUpdateService from '../services/otaUpdates';

interface UpdateManagerProps {
  checkOnMount?: boolean;
  autoUpdate?: boolean;
}

const UpdateManager: React.FC<UpdateManagerProps> = ({
  checkOnMount = true,
  autoUpdate = false,
}) => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (checkOnMount) {
      checkForUpdates();
    }

    // Set up periodic checks
    const interval = setInterval(() => {
      checkForUpdates(true);
    }, 3600000); // Check every hour

    return () => {
      clearInterval(interval);
      otaUpdateService.cleanup();
    };
  }, []);

  const checkForUpdates = async (silent: boolean = false) => {
    try {
      const result = await otaUpdateService.checkForUpdates(silent);

      if (result.isAvailable) {
        setUpdateAvailable(true);
        setShowModal(!silent);

        if (autoUpdate) {
          await downloadAndApplyUpdate();
        }
      }
    } catch (error) {
      console.error('[UpdateManager] Check failed:', error);
      if (!silent) {
        setError('Failed to check for updates');
      }
    }
  };

  const downloadAndApplyUpdate = async () => {
    try {
      setDownloading(true);
      setError(null);

      const success = await otaUpdateService.fetchAndApplyUpdate(false);

      if (success) {
        // Update will be applied on next app restart
        setShowModal(false);
        // Optionally show success message
      }
    } catch (error) {
      console.error('[UpdateManager] Download failed:', error);
      setError('Failed to download update');
    } finally {
      setDownloading(false);
    }
  };

  const handleUpdateNow = async () => {
    try {
      setDownloading(true);
      setError(null);

      const success = await otaUpdateService.fetchAndApplyUpdate(true);

      if (success) {
        // App will reload
      }
    } catch (error) {
      console.error('[UpdateManager] Update failed:', error);
      setError('Failed to install update');
      setDownloading(false);
    }
  };

  const handleUpdateLater = () => {
    setShowModal(false);
    // Update will be applied on next app launch
  };

  const handleSkip = () => {
    setShowModal(false);
    setUpdateAvailable(false);
  };

  if (!showModal) {
    return null;
  }

  return (
    <Modal visible={showModal} transparent animationType="fade" onRequestClose={handleSkip}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Update Available</Text>

          <Text style={styles.message}>
            A new version of the app is available. Would you like to update now?
          </Text>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {downloading ? (
            <View style={styles.downloadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.downloadingText}>Downloading update...</Text>
            </View>
          ) : (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleUpdateNow}
                disabled={downloading}
              >
                <Text style={styles.primaryButtonText}>Update Now</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleUpdateLater}
                disabled={downloading}
              >
                <Text style={styles.secondaryButtonText}>Later</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
                disabled={downloading}
              >
                <Text style={styles.skipButtonText}>Skip this version</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    textAlign: 'center',
  },
  downloadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  downloadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f5f5f5',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    padding: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#999',
    fontSize: 14,
  },
});

export default UpdateManager;
