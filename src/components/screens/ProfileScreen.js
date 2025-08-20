import { VITE_API_URL, VITE_IMAGE_URL } from '@env';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
  const handleFileChange = () => {
    Alert.alert(
      'Select Option',
      'Choose a profile picture',
      [
        {
          text: 'Camera',
          onPress: () => {
            launchCamera({ mediaType: 'photo', quality: 0.7 }, response => {
              if (
                !response.didCancel &&
                !response.errorCode &&
                response.assets?.length > 0
              ) {
                const file = response.assets[0];
                setSelectedFile(file);
              }
            });
          },
        },
        {
          text: 'Gallery',
          onPress: () => {
            launchImageLibrary(
              { mediaType: 'photo', quality: 0.7 },
              response => {
                if (
                  !response.didCancel &&
                  !response.errorCode &&
                  response.assets?.length > 0
                ) {
                  const file = response.assets[0];
                  setSelectedFile(file);
                }
              },
            );
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true },
    );
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

      const response = await axios.put(
        `${VITE_API_URL}/users/update-profile`,
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
          onPress={handleFileChange}
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
    padding: 20,
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 20,
  },
  imageContainer: {
    marginBottom: 12,
  },
  imageWrapper: {
    position: 'relative',
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: '#fff',
    ...CARD_SHADOW,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    ...CARD_SHADOW,
  },
  placeholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
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
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
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
    paddingHorizontal: 16,
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
    paddingHorizontal: 16,
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
    paddingVertical: 16,
    paddingHorizontal: 24,
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
});
