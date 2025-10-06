import { reactive, computed } from 'vue';

export function useCompletedCollapse(requests, isCompleted) {
  const completedCollapsed = reactive({});

  const syncCompletedCollapseState = () => {
    requests.value.forEach((req) => {
      if (isCompleted(req)) {
        if (completedCollapsed[req.id] === undefined) {
          completedCollapsed[req.id] = true;
        }
      } else if (completedCollapsed[req.id] !== undefined) {
        delete completedCollapsed[req.id];
      }
    });
  };

  const isCompletedCollapsed = (req) => {
    if (!isCompleted(req)) return false;
    const state = completedCollapsed[req.id];
    return state === undefined ? true : state;
  };

  const toggleCompletedCollapse = (req) => {
    if (!isCompleted(req)) return;
    completedCollapsed[req.id] = !isCompletedCollapsed(req);
  };

  return {
    completedCollapsed,
    syncCompletedCollapseState,
    isCompletedCollapsed,
    toggleCompletedCollapse,
  };
}

