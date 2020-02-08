import { Injectable } from '@angular/core';
import {
  ADD_TASK,
  DELETE_TASK,
  GET_TASKS,
  UPDATE_TASK
} from './graphql.queries';
import { AllTasks, Task } from './types';
import { VoyagerService } from './voyager.service';
import {
  ApolloOfflineClient,
  CacheOperation,
  subscribeToMoreHelper,
  ApolloOfflineStore
} from 'offix-client-boost';
import { subscriptionOptions } from './cache.updates';

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  private readonly apollo: ApolloOfflineClient;
  private offlineStore: ApolloOfflineStore;

  constructor(aeroGear: VoyagerService) {
    this.apollo = aeroGear.apolloClient;
    this.offlineStore = aeroGear.offlineStore;
  }

  /**
   * Force cache refresh to get recent data
   */
  refreshTasks() {
    // Force cache refresh by performing network
    return this.apollo.query<AllTasks>({
      query: GET_TASKS,
      fetchPolicy: 'network-only',
      errorPolicy: 'none'
    });
  }

  // Watch local cache for updates
  getTasks() {
    const getTasks = this.apollo.watchQuery<AllTasks>({
      query: GET_TASKS,
      fetchPolicy: 'cache-first',
      errorPolicy: 'none'
    });
    subscribeToMoreHelper(getTasks, subscriptionOptions);
    return getTasks;
  }

  createTask(title, description) {
    return this.apollo.offlineMutate<Task>({
        mutation: ADD_TASK,
        variables: {
          'title': title,
          'description': description,
          'version': 1,
          'status': 'OPEN'
        },
        updateQuery: GET_TASKS,
        returnType: 'Task'
      });
  }

  updateTask(task) {
    return this.apollo.offlineMutate<Task>({
        mutation: UPDATE_TASK,
        variables: task,
        updateQuery: GET_TASKS,
        returnType: 'Task',
        operationType: CacheOperation.REFRESH
      }
    );
  }

  deleteTask(task) {
    return this.apollo.offlineMutate<Task>({
        mutation: DELETE_TASK,
        variables: task,
        updateQuery: GET_TASKS,
        returnType: 'Task',
        operationType: CacheOperation.DELETE
      }
    );
  }

  getOfflineTasks() {
    return this.offlineStore.getOfflineData();
  }

  getClient() {
    return this.apollo;
  }
}