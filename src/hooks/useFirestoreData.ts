// src/hooks/useFirestoreData.ts

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import type { AppUser, Appointment } from "../types";

export const useFirestoreData = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch users
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersData = usersSnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as AppUser)
      );
      setUsers(usersData);

      // Fetch appointments
      const appointmentsSnapshot = await getDocs(
        collection(db, "appointments")
      );
      const appointmentsData = appointmentsSnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Appointment)
      );
      setAppointments(appointmentsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    users,
    appointments,
    loading,
    refetch: fetchData,
  };
};
