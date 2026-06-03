import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { loginUser, registerUser, registerWithShop, verifyOTP, getProfile, updateProfile } from "./authAPI";
import useAuthStore from "../../store/useAuthStore";

function persistAuth(data) {
  const login = useAuthStore.getState().login;
  if (data?.success && data?.data) {
    login(data.data);
  }
}

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials) => {
      const response = await loginUser(credentials);
      return response.data;
    },
    onSuccess: (data) => {
      persistAuth(data);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData) => {
      const response = await registerUser(formData);
      return response.data;
    },
    onSuccess: (data) => {
      persistAuth(data);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};

export const useRegisterWithShop = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData) => {
      const response = await registerWithShop(formData);
      return response.data;
    },
    onSuccess: (data) => {
      persistAuth(data);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      if (data?.data?.shop?._id) {
        queryClient.invalidateQueries({ queryKey: ["shops", data.data._id] });
      }
    },
  });
};

export const useVerifyOTP = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ phone, otp }) => {
      const response = await verifyOTP({ phone, otp });
      return response.data;
    },
    onSuccess: (data) => {
      persistAuth(data);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};

export const useProfile = () => {
  const token = useAuthStore((state) => state.token);
  const updateUser = useAuthStore((state) => state.updateUser);

  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await getProfile();
      return response.data;
    },
    enabled: !!token,
    onSuccess: (data) => {
      if (data.success && data.data) {
        updateUser(data.data);
      }
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: async (profileData) => {
      const response = await updateProfile(profileData);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        updateUser(data.data);
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      }
    },
  });
};
