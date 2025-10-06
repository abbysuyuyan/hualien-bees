import { reactive } from 'vue';
import { ElMessage } from 'element-plus';

const API_BASE_URL = "https://guangfu250923.pttapp.cc";

export function useDelivery() {
  const submitting = reactive({
    delivery: false,
  });

  const updateDeliveryProgress = async (requestId, deliveryData) => {
    const deliveryBySupply = {};
    Object.entries(deliveryData).forEach(([indexStr, newGot]) => {
      const index = Number(indexStr);
      const supplyId = requestId;
      if (!deliveryBySupply[supplyId]) {
        deliveryBySupply[supplyId] = [];
      }
      const count = newGot;
      if (count > 0) {
        deliveryBySupply[supplyId].push({ id: index, count });
      }
    });
    const promises = Object.entries(deliveryBySupply).map(([supplyId, items]) =>
      fetch(`${API_BASE_URL}/supplies/${supplyId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(items),
      })
    );
    const responses = await Promise.all(promises);
    for (let i = 0; i < responses.length; i += 1) {
      const response = responses[i];
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`配送失敗: HTTP ${response.status} - ${errorText}`);
      }
    }
  };

  const submitDelivery = async (target, summary) => {
    if (submitting.delivery) return;
    submitting.delivery = true;
    try {
      const deliveryData = {};
      summary.forEach((item) => {
        const original = target.items[item.index];
        const remain = Math.max(0, (original.need ?? 0) - (original.got ?? 0));
        const newGot = Math.min(
          original.need,
          (original.got ?? 0) + Math.min(item.qty, remain)
        );
        deliveryData[item.index] = newGot;
      });
      await updateDeliveryProgress(target.id, deliveryData);
      ElMessage.success("已提交配送");
      return true;
    } catch (error) {
      ElMessage.error(error.message || "配送更新失敗");
      throw error;
    } finally {
      submitting.delivery = false;
    }
  };

  const submitDeliverAll = async (target, summary) => {
    if (submitting.delivery) return;
    submitting.delivery = true;
    try {
      const deliveryData = {};
      summary.forEach((item) => {
        deliveryData[item.index] = target.items[item.index].need;
      });
      await updateDeliveryProgress(target.id, deliveryData);
      ElMessage.success("已標記全部送達");
      return true;
    } catch (error) {
      ElMessage.error(error.message || "配送更新失敗");
      throw error;
    } finally {
      submitting.delivery = false;
    }
  };

  return {
    submitting,
    submitDelivery,
    submitDeliverAll,
  };
}

