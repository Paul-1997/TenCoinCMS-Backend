import { Vendor } from '@/types';

// 靜態廠商資料（與前端保持一致）
const VENDORS: Vendor[] = [
  { id: "01", name: "久益" },
  { id: "02", name: "益發" },
  { id: "03", name: "華" },
  { id: "05", name: "長呈" },
  { id: "08", name: "台利" },
  { id: "12", name: "博志" },
  { id: "15", name: "金禾" },
  { id: "17", name: "松果" },
  { id: "20", name: "天母" },
  { id: "23", name: "承佑" }
];

export class VendorService {
  /**
   * 獲取所有廠商
   */
  async getAllVendors(): Promise<Vendor[]> {
    return Promise.resolve([...VENDORS]);
  }

  /**
   * 根據 ID 獲取廠商
   */
  async getVendorById(id: string): Promise<Vendor | null> {
    const vendor = VENDORS.find(v => v.id === id);
    return Promise.resolve(vendor || null);
  }

  /**
   * 根據 IDs 獲取多個廠商
   */
  async getVendorsByIds(ids: string[]): Promise<Vendor[]> {
    const vendors = VENDORS.filter(v => ids.includes(v.id));
    return Promise.resolve(vendors);
  }

  /**
   * 驗證廠商 ID 是否有效
   */
  async validateVendorIds(vendorIds: string[]): Promise<boolean> {
    if (!vendorIds || vendorIds.length === 0) {
      return false;
    }
    
    const validIds = VENDORS.map(v => v.id);
    return vendorIds.every(id => validIds.includes(id));
  }

  /**
   * 獲取廠商名稱映射（用於顯示）
   */
  getVendorNameMap(): Record<string, string> {
    return VENDORS.reduce((map, vendor) => {
      map[vendor.id] = vendor.name;
      return map;
    }, {} as Record<string, string>);
  }

  /**
   * 搜尋廠商（根據名稱）
   */
  async searchVendors(keyword: string): Promise<Vendor[]> {
    const filtered = VENDORS.filter(vendor => 
      vendor.name.toLowerCase().includes(keyword.toLowerCase()) ||
      vendor.id.includes(keyword)
    );
    return Promise.resolve(filtered);
  }
} 