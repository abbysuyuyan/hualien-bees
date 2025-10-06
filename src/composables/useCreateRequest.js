import { reactive } from 'vue';
import { ElMessage } from 'element-plus';

const API_BASE_URL = "https://guangfu250923.pttapp.cc";

export function useCreateRequest() {
  const submitting = reactive({
    create: false,
  });

  const transformToApiData = (frontendData) => {
    if (frontendData.items.length === 0) {
      throw new Error("至少需要一個物資項目");
    }
    return {
      name: frontendData.org,
      address: frontendData.address,
      phone: frontendData.phone,
      supplies: {
        tag: frontendData.items[0].type,
        name: frontendData.items[0].name,
        recieved_count: frontendData.items[0].got,
        total_count: frontendData.items[0].need,
        unit: frontendData.items[0].unit,
      },
    };
  };

  const createRequest = async (payload) => {
    const promises = payload.items.map((item) => {
      const apiData = transformToApiData({ ...payload, items: [item] });
      return fetch(`${API_BASE_URL}/supplies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      });
    });
    const responses = await Promise.all(promises);
    for (let i = 0; i < responses.length; i += 1) {
      const response = responses[i];
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `第 ${i + 1} 個物資新增失敗: HTTP ${response.status} - ${errorText}`
        );
      }
    }
  };

  const submitCreate = async (payload) => {
    if (submitting.create) return;
    submitting.create = true;
    try {
      await createRequest(payload);
      ElMessage.success(`已新增 ${payload.items.length} 個物資需求`);
      return true;
    } catch (error) {
      ElMessage.error(error.message || "新增需求失敗");
      throw error;
    } finally {
      submitting.create = false;
    }
  };

  return {
    submitting,
    submitCreate,
  };
}

