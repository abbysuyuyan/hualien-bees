import { computed } from 'vue';

export function useFilters(requests, activeTab, selectedTag) {
  const TYPE_MAP = {
    "食物/水": { label: "飲食", order: 0, color: "#14b8a6" },
    醫療用品: { label: "醫療用品", order: 1, color: "#f59e0b" },
    生活用品: { label: "生活用品", order: 2, color: "#22c55e" },
    大型機具: { label: "大型機具", order: 3, color: "#3b82f6" },
    動物醫療: { label: "動物醫療", order: 4, color: "#934f36" },
    水電: { label: "水電", order: 5, color: "#8b5cf6" },
    其他: { label: "其他", order: 6, color: "#a855f7" },
  };

  const typeOptions = Object.keys(TYPE_MAP).map((value) => ({
    value,
    label: TYPE_MAP[value].label,
  }));

  const typeMeta = (type) => TYPE_MAP[type] ?? TYPE_MAP["其他"];

  const isCompleted = (req) =>
    req.items.every((item) => (item.got ?? 0) >= (item.need ?? 0));

  const requestStatus = (req) => {
    if (isCompleted(req)) return { label: "已完成", type: "success" };
    if (
      req.items.some(
        (item) => item.type === "醫療用品" && Math.max(0, (item.need ?? 0) - (item.got ?? 0)) > 0
      )
    ) {
      return { label: "緊急", type: "danger" };
    }
    if (req.items.some((item) => Math.max(0, (item.need ?? 0) - (item.got ?? 0)) > 0)) {
      return { label: "尚缺", type: "warning" };
    }
    return { label: "緊急", type: "danger" };
  };

  const mergeRequestsByOrganization = (list) => {
    const mergedMap = new Map();
    list.forEach((req) => {
      const key = `${req.org}|${req.address}|${req.phone}`;
      const itemsWithSupplyId = req.items.map((item) => ({
        ...item,
        supplyId: req.id,
      }));
      if (mergedMap.has(key)) {
        const existing = mergedMap.get(key);
        existing.items.push(...itemsWithSupplyId);
        if (req.created_at > existing.created_at) {
          existing.created_at = req.created_at;
        }
      } else {
        mergedMap.set(key, {
          ...req,
          items: itemsWithSupplyId,
        });
      }
    });
    return Array.from(mergedMap.values());
  };

  const mergedRequests = computed(() => {
    const merged = mergeRequestsByOrganization(requests.value);
    return merged.sort((a, b) => {
      const aCompleted = isCompleted(a);
      const bCompleted = isCompleted(b);
      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;
      return 0;
    });
  });

  const visibleRequests = computed(() => {
    let list = mergedRequests.value;
    
    // 根據 tab 篩選
    if (activeTab.value === 'pending') {
      list = list.filter((req) => !isCompleted(req));
    } else if (activeTab.value === 'completed') {
      list = list.filter((req) => isCompleted(req));
    }
    
    // 類別篩選
    if (selectedTag.value) {
      list = list.filter((req) =>
        req.items.some((item) => item.type === selectedTag.value)
      );
    }
    
    
    return list;
  });

  return {
    typeOptions,
    typeMeta,
    isCompleted,
    requestStatus,
    mergedRequests,
    visibleRequests,
  };
}

