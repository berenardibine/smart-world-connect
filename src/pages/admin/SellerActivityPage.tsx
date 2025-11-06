import { useEffect, useState } from "react";
import { getSellerActivity } from "@/lib/planTracker";

interface Seller {
  id: string;
  name: string;
}

const mockSellers: Seller[] = [
  { id: "USER001", name: "Divine Shop" },
  { id: "USER002", name: "SmartTech Store" },
  { id: "USER003", name: "Alpha Traders" },
];

export const SellerActivityPage = () => {
  const [activities, setActivities] = useState<Record<string, any>>({});

  useEffect(() => {
    const data: Record<string, any> = {};
    mockSellers.forEach((seller) => {
      data[seller.id] = getSellerActivity(seller.id);
    });
    setActivities(data);
  }, []);

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6 text-orange-600">
        Seller Activity Tracking
      </h1>
      <table className="w-full border border-gray-200 rounded-lg">
        <thead className="bg-orange-50">
          <tr>
            <th className="p-3 text-left">Seller</th>
            <th className="p-3 text-left">Products Posted</th>
            <th className="p-3 text-left">Updates Created</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(activities).map((id) => (
            <tr key={id} className="border-t border-gray-100">
              <td className="p-3">
                {mockSellers.find((s) => s.id === id)?.name || id}
              </td>
              <td className="p-3">{activities[id].products}</td>
              <td className="p-3">{activities[id].updates}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
