import React, { useEffect, useRef } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { useAppSelector } from '@store/hooks';

export default function TabsLayout() {
  const router = useRouter();
  const { activeRole } = useAppSelector(state => state.auth);
  const previousRoleRef = useRef(activeRole);

  useEffect(() => {
    if (previousRoleRef.current !== activeRole && activeRole) {
      const targetRoute = activeRole === 'parent' ? '/(tabs)/parent' : '/(tabs)/student';
      router.replace(targetRoute);
      previousRoleRef.current = activeRole;
    }
  }, [activeRole, router]);

  if (!activeRole) {
    return <Redirect href="/(tabs)/student" />;
  }

  if (activeRole === 'student') {
    return <Redirect href="/(tabs)/student" />;
  } else if (activeRole === 'parent') {
    return <Redirect href="/(tabs)/parent" />;
  }

  return <Redirect href="/(tabs)/student" />;
}
