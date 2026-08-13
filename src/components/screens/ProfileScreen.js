import { API_URL, VITE_IMAGE_URL } from '@env';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Toast from 'react-native-toast-message';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';

import { fetchUser } from '../redux/authSlice';
import {
  CARD_SHADOW,
  INACTIVE_COLOR,
  LIGHT_BG,
  PRIMARY_COLOR,
} from '../theme/theme';

const ProfileScreen = () => {
  const user = useSelector(state => state.auth.data);
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    empId: '',
    contact: '',
    location: '',
    jobTitle: '',
    role: 'employee',
    organization: '',
    profilePic: '',
  });

  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showImagePicker, setShowImagePicker] = useState(false);

  // Update state when Redux user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        empId: user.empId || '',
        contact: user.contact || '',
        location: user.location || '',
        jobTitle: user.jobTitle || '',
        role: user.role || 'employee',
        organization: user.organization || '',
        profilePic: user.profilePic || '',
      });
    }
  }, [user]);

  // Handle input change
  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  // Select profile image
  const handlePickerResponse = response => {
    if (response.errorCode) {
      Toast.show({
        type: 'error',
        text1: 'Could not select photo',
        text2: response.errorMessage || 'Please try again.',
      });
      return;
    }
    if (!response.didCancel && response.assets?.[0]) {
      setSelectedFile(response.assets[0]);
      Toast.show({
        type: 'success',
        text1: 'Photo selected',
        text2: 'Tap Update Profile to save your new photo.',
      });
    }
  };

  const pickImage = source => {
    setShowImagePicker(false);
    const options = { mediaType: 'photo', quality: 0.8, selectionLimit: 1 };
    if (source === 'camera') {
      launchCamera(options, handlePickerResponse);
    } else {
      launchImageLibrary(options, handlePickerResponse);
    }
  };

  // Submit form
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const formDataImage = new FormData();
      Object.keys(formData).forEach(key => {
        formDataImage.append(key, formData[key]);
      });

      if (selectedFile) {
        formDataImage.append('profilePic', {
          uri: selectedFile.uri,
          type: selectedFile.type,
          name: selectedFile.fileName,
        });
      }

      await axios.put(
        `${API_URL}/users/update-profile`,
        formDataImage,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        },
      );

      dispatch(fetchUser());

      Toast.show({
        type: 'success',
        text1: 'Profile updated successfully!',
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: err.response?.data?.message || 'Failed to update profile',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Image Section */}
      <View style={styles.profileSection}>
        <TouchableOpacity
          onPress={() => setShowImagePicker(true)}
          style={styles.imageContainer}
          activeOpacity={0.8}
        >
          {selectedFile?.uri || formData.profilePic ? (
            <View style={styles.imageWrapper}>
              <Image
                source={{
                  uri:
                    selectedFile?.uri ||
                    `${VITE_IMAGE_URL}/profilePics/${formData.profilePic}`,
                }}
                style={styles.profileImage}
              />
              <View style={styles.imageOverlay}>
                <MaterialIcons name="camera-alt" size={24} color="#fff" />
              </View>
            </View>
          ) : (
            <View style={styles.placeholder}>
              <MaterialIcons
                name="add-a-photo"
                size={32}
                color={INACTIVE_COLOR}
              />
              <Text style={styles.placeholderText}>Add Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.imageHint}>Tap to change profile picture</Text>
      </View>

      {/* Form Section */}
      <View style={styles.formSection}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor={INACTIVE_COLOR}
            value={formData.name}
            onChangeText={text => handleChange('name', text)}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            placeholder="Email address"
            placeholderTextColor={INACTIVE_COLOR}
            value={formData.email}
            editable={false}
          />
          <Text style={styles.inputHint}>Email cannot be changed</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Employee ID *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter employee ID"
            placeholderTextColor={INACTIVE_COLOR}
            value={formData.empId}
            onChangeText={text => handleChange('empId', text)}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Contact Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter contact number"
            placeholderTextColor={INACTIVE_COLOR}
            value={formData.contact}
            onChangeText={text => handleChange('contact', text)}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your location"
            placeholderTextColor={INACTIVE_COLOR}
            value={formData.location}
            onChangeText={text => handleChange('location', text)}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Job Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your job title"
            placeholderTextColor={INACTIVE_COLOR}
            value={formData.jobTitle}
            onChangeText={text => handleChange('jobTitle', text)}
          />
        </View>

        {/* Role Display (Read-only) */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Role</Text>
          <View style={styles.roleContainer}>
            <MaterialIcons name="badge" size={20} color={PRIMARY_COLOR} />
            <Text style={styles.roleText}>
              {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}
            </Text>
          </View>
        </View>

        {/* Organization Display (Read-only) */}
        {formData.organization && (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Organization</Text>
            <View style={styles.roleContainer}>
              <MaterialIcons name="business" size={20} color={PRIMARY_COLOR} />
              <Text style={styles.roleText}>{formData.organization}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Action Section */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <View style={styles.buttonContent}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.buttonText}>Updating...</Text>
            </View>
          ) : (
            <View style={styles.buttonContent}>
              <MaterialIcons name="save" size={20} color="#fff" />
              <Text style={styles.buttonText}>Update Profile</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={showImagePicker}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowImagePicker(false)}
      >
        <Pressable
          style={styles.pickerBackdrop}
          onPress={() => setShowImagePicker(false)}
        >
          <Pressable style={styles.pickerSheet} onPress={() => {}}>
            <View style={styles.pickerHandle} />
            <View style={styles.pickerHeader}>
              <View>
                <Text style={styles.pickerTitle}>Update profile photo</Text>
                <Text style={styles.pickerSubtitle}>
                  Choose where you want to get your photo
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowImagePicker(false)}
              >
                <MaterialIcons name="close" size={21} color="#475569" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.pickerOption}
              activeOpacity={0.75}
              onPress={() => pickImage('camera')}
            >
              <View style={[styles.optionIcon, styles.cameraIcon]}>
                <MaterialIcons name="photo-camera" size={25} color="#3156A3" />
              </View>
              <View style={styles.optionCopy}>
                <Text style={styles.optionTitle}>Take a photo</Text>
                <Text style={styles.optionSubtitle}>Use your device camera</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#94A3B8" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.pickerOption}
              activeOpacity={0.75}
              onPress={() => pickImage('gallery')}
            >
              <View style={[styles.optionIcon, styles.galleryIcon]}>
                <MaterialIcons name="photo-library" size={25} color="#8B4A20" />
              </View>
              <View style={styles.optionCopy}>
                <Text style={styles.optionTitle}>Choose from gallery</Text>
                <Text style={styles.optionSubtitle}>Select an existing photo</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Toast />
    </ScrollView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_BG,
  },
  contentContainer: {
    padding: 14,
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 22,
    paddingVertical: 14,
  },
  imageContainer: {
    marginBottom: 12,
  },
  imageWrapper: {
    position: 'relative',
  },
  profileImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: '#fff',
    ...CARD_SHADOW,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 14,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    ...CARD_SHADOW,
  },
  placeholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    ...CARD_SHADOW,
  },
  placeholderText: {
    color: INACTIVE_COLOR,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  imageHint: {
    fontSize: 14,
    color: INACTIVE_COLOR,
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
    ...CARD_SHADOW,
  },
  disabledInput: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    color: INACTIVE_COLOR,
  },
  inputHint: {
    fontSize: 12,
    color: INACTIVE_COLOR,
    marginTop: 4,
    fontStyle: 'italic',
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    ...CARD_SHADOW,
  },
  roleText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    marginLeft: 12,
  },
  actionSection: {
    marginTop: 8,
  },
  button: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...CARD_SHADOW,
  },
  buttonDisabled: {
    backgroundColor: INACTIVE_COLOR,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  pickerBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.52)',
  },
  pickerSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
  },
  pickerHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 18,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  pickerTitle: { fontSize: 20, fontWeight: '700', color: '#172033' },
  pickerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 4 },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  pickerOption: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FAFCFF',
  },
  optionIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: { backgroundColor: '#E8F0FF' },
  galleryIcon: { backgroundColor: '#FFF0E6' },
  optionCopy: { flex: 1, marginLeft: 13 },
  optionTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  optionSubtitle: { fontSize: 12, color: '#64748B', marginTop: 3 },
});
