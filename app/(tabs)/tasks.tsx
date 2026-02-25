import AddTaskModal from '@/components/tasks/AddTaskModal';
import TaskCard from '@/components/tasks/TaskCard';
import { Fonts } from '@/constants/Fonts';
import { useTaskStore, Task } from '@/store/useTaskStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const tasks = useTaskStore((s) => s.tasks);
  const resetForNewDay = useTaskStore((s) => s.resetForNewDay);
  const [modalVisible, setModalVisible] = useState(false);

  const handleRefresh = useCallback(() => {
    resetForNewDay();
  }, [resetForNewDay]);

  const renderItem = useCallback(({ item }: { item: Task }) => {
    return <TaskCard task={item} />;
  }, []);

  const keyExtractor = useCallback((item: Task) => item.id, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Today's Tasks</Text>
      </View>

      {/* Task list */}
      {tasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkbox-outline" size={64} color="rgba(255,255,255,0.2)" />
          <Text style={styles.emptyTitle}>No tasks yet</Text>
          <Text style={styles.emptySubtitle}>Add your first task</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          onRefresh={handleRefresh}
          refreshing={false}
        />
      )}

      {/* Floating action button */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 90 }]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#FF6B82', '#F04560', '#C83050']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={32} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Add task modal */}
      <AddTaskModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: Fonts.interBold,
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: Fonts.semiBold,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#FF3B5C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
