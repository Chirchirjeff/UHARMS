// src/screens/shared/MessageListScreen.tsx
import React, { useState, useContext, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthContext } from '../../context/AuthContext';
import { BASE_URL } from '../../config/api';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PatientStackParamList, DoctorStackParamList } from '../../navigation/types';

type ChatScreenNavigationProp = NativeStackNavigationProp<
  PatientStackParamList & DoctorStackParamList,
  'ChatScreen'
>;

interface Conversation {
  _id: string;
  otherUser: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  appointment?: {
    _id: string;
    date: string;
    time: string;
  };
  // New fields for message status
  lastMessageId?: string;
  lastMessageStatus?: {
    isRead: boolean;
    deliveredAt: string | null;
    isSentByMe: boolean;
  };
}

// Helper function to get message status icon and text
const getMessageStatusIndicator = (status: Conversation['lastMessageStatus']) => {
  if (!status) return null;
  
  if (!status.isSentByMe) return null; // Only show status for messages sent by current user
  
  if (status.isRead) {
    return {
      icon: "check-all",
      color: "#16a34a",
      text: "Read"
    };
  }
  
  if (status.deliveredAt) {
    return {
      icon: "check-all",
      color: "#94a3b8",
      text: "Delivered"
    };
  }
  
  return {
    icon: "check",
    color: "#94a3b8",
    text: "Sent"
  };
};

const MessageListScreen: React.FC = () => {
  const { user, token } = useContext(AuthContext);
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusPollingInterval, setStatusPollingInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  const fetchConversations = async () => {
    if (!token) {
      console.log('No token available, skipping fetch');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching conversations with token...');
      const response = await fetch(`${BASE_URL}/messages/conversations`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Conversations received:', data.length);
      
      // Fetch latest message status for each conversation
      const conversationsWithStatus = await Promise.all(
        data.map(async (conv: Conversation) => {
          try {
            const messagesResponse = await fetch(`${BASE_URL}/messages/conversations/${conv._id}/messages`, {
              headers: { 'Authorization': `Bearer ${token}` },
            });
            
            if (messagesResponse.ok) {
              const messages = await messagesResponse.json();
              const lastMessage = messages[messages.length - 1];
              
              if (lastMessage) {
                return {
                  ...conv,
                  lastMessageId: lastMessage._id,
                  lastMessageStatus: {
                    isRead: lastMessage.isRead || false,
                    deliveredAt: lastMessage.deliveredAt || null,
                    isSentByMe: lastMessage.senderId?._id === user?.id
                  }
                };
              }
            }
          } catch (error) {
            console.error('Error fetching message status:', error);
          }
          return conv;
        })
      );
      
      setConversations(conversationsWithStatus);
      setError(null);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError('Failed to load conversations. Pull down to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Poll for message status updates
  const startStatusPolling = useCallback(() => {
    if (statusPollingInterval) {
      clearInterval(statusPollingInterval);
    }
    
    const interval = setInterval(async () => {
      if (token && conversations.length > 0) {
        // Update status for conversations that have unread or undelivered messages
        const updatedConversations = await Promise.all(
          conversations.map(async (conv) => {
            if (conv.lastMessageId && conv.lastMessageStatus?.isSentByMe && !conv.lastMessageStatus.isRead) {
              try {
                const messagesResponse = await fetch(`${BASE_URL}/messages/conversations/${conv._id}/messages`, {
                  headers: { 'Authorization': `Bearer ${token}` },
                });
                
                if (messagesResponse.ok) {
                  const messages = await messagesResponse.json();
                  const lastMessage = messages[messages.length - 1];
                  
                  if (lastMessage && lastMessage._id === conv.lastMessageId) {
                    const newStatus = {
                      isRead: lastMessage.isRead || false,
                      deliveredAt: lastMessage.deliveredAt || null,
                      isSentByMe: true
                    };
                    
                    // Only update if status changed
                    if (newStatus.isRead !== conv.lastMessageStatus?.isRead ||
                        newStatus.deliveredAt !== conv.lastMessageStatus?.deliveredAt) {
                      return { ...conv, lastMessageStatus: newStatus };
                    }
                  }
                }
              } catch (error) {
                console.error('Error polling message status:', error);
              }
            }
            return conv;
          })
        );
        
        // Only update state if something changed
        const hasChanges = updatedConversations.some((conv, index) => 
          JSON.stringify(conv.lastMessageStatus) !== JSON.stringify(conversations[index].lastMessageStatus)
        );
        
        if (hasChanges) {
          setConversations(updatedConversations);
        }
      }
    }, 5000); // Poll every 5 seconds
    
    setStatusPollingInterval(interval);
  }, [token, conversations]);

  // Stop polling on unmount
  useEffect(() => {
    return () => {
      if (statusPollingInterval) {
        clearInterval(statusPollingInterval);
      }
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
      
      // Start polling when screen is focused
      const interval = setTimeout(() => {
        startStatusPolling();
      }, 1000);
      
      return () => {
        if (interval) clearTimeout(interval);
        if (statusPollingInterval) clearInterval(statusPollingInterval);
      };
    }, [token])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const diffHours = diff / (1000 * 60 * 60);

      if (diffHours < 24)
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (diffHours < 48) return 'Yesterday';
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (error) {
      return '';
    }
  };

  const getInitials = (name: string) =>
    name?.charAt(0).toUpperCase() || '?';

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    fetchConversations();
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const statusIndicator = getMessageStatusIndicator(item.lastMessageStatus);
    
    return (
      <TouchableOpacity
        style={styles.conversationCard}
        onPress={() =>
          navigation.navigate('ChatScreen', {
            conversationId: item._id,
            otherUser: item.otherUser,
            appointment: item.appointment
          })
        }
        activeOpacity={0.7}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {getInitials(item.otherUser?.name)}
          </Text>
        </View>

        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text style={styles.userName}>
              {item.otherUser?.name || 'Unknown'}
            </Text>
            <Text style={styles.timeText}>
              {formatTime(item.lastMessageAt)}
            </Text>
          </View>

          <View style={styles.lastMessageContainer}>
            {statusIndicator && (
              <Icon 
                name={statusIndicator.icon} 
                size={14} 
                color={statusIndicator.color}
                style={styles.statusIcon}
              />
            )}
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage?.trim() || 'Tap to start messaging'}
            </Text>
          </View>

          {item.appointment && (
            <View style={styles.appointmentBadge}>
              <Icon name="calendar" size={12} color="#16a34a" />
              <Text style={styles.appointmentText}>
                Appointment: {item.appointment.date}
              </Text>
            </View>
          )}
        </View>

        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>
              {item.unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Loading conversations...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={60} color="#ef4444" />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Messages</Text>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item._id}
        renderItem={renderConversation}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#16a34a']}
            tintColor="#16a34a"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="message-text-outline" size={70} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Messages Yet</Text>
            <Text style={styles.emptyDescription}>
              {user?.role === 'patient'
                ? "When you book an appointment, you can message your doctor here."
                : "When patients book appointments, conversations will appear here."}
            </Text>
            {user?.role === 'patient' && (
              <TouchableOpacity 
                style={styles.bookButton}
                onPress={() => navigation.getParent()?.navigate('Department')}
              >
                <Icon name="calendar-plus" size={16} color="#fff" />
                <Text style={styles.bookButtonText}>Book an Appointment</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loaderContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  listContent: { paddingBottom: 20 },
  conversationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  conversationInfo: { flex: 1 },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  timeText: { fontSize: 11, color: '#94a3b8' },
  lastMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusIcon: {
    marginRight: 4,
  },
  lastMessage: { 
    fontSize: 13, 
    color: '#64748b',
    flex: 1,
  },
  appointmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  appointmentText: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#16a34a',
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 7,
  },
  unreadText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginTop: 20,
    gap: 8,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default MessageListScreen;