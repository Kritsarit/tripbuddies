
import React, { useState, useEffect } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Keyboard,
  Modal,
  ActivityIndicator,
  AppState,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";

import { Ionicons } from "@expo/vector-icons";

import {
  useFonts,
  Prompt_400Regular,
  Prompt_500Medium,
  Prompt_600SemiBold,
  Prompt_700Bold,
} from "@expo-google-fonts/prompt";

import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./supabase";

// ==========================================
// 2. COLORS
// ==========================================

const C = {
  pink: "#E05D76",
  pinkDark: "#C7425C",
  pinkLight: "#FCECEF",
  pinkBg: "#FAF7F8",
  white: "#FFFFFF",
  text: "#201317",
  textMuted: "#736067",
  muted: "#9C878F",
  border: "#EFE3E6",
  borderLight: "#F8EFF1",
  green: "#1B9962",
  greenLight: "#E8F8F0",
  orange: "#E07534",
  orangeLight: "#FFF1E8",
  blue: "#3884E8",
  blueLight: "#EDF4FE",
  cardBg: "#FFFFFF",
  shadow: "rgba(32, 19, 23, 0.05)",
  shadowMedium: "rgba(32, 19, 23, 0.10)",
};

// ==========================================
// 3. REUSABLE COMPONENTS
// ==========================================

function Button({
  title,
  onPress,
  outline = false,
  style,
  disabled = false,
  icon,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      disabled={disabled}
      onPress={onPress}
      style={[
        s.button,
        outline && s.buttonOutline,
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      {!!icon && (
        <Ionicons
          name={icon}
          size={18}
          color={outline ? C.pinkDark : C.white}
          style={{ marginRight: 8 }}
        />
      )}
      <Text
        style={[
          s.buttonText,
          outline && s.buttonOutlineText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
  icon,
}) {
  return (
    <View style={s.field}>
      {!!label && <Text style={s.label}>{label}</Text>}

      <View style={s.inputContainer}>
        {!!icon && (
          <Ionicons
            name={icon}
            size={18}
            color={C.muted}
            style={s.inputIcon}
          />
        )}
        <TextInput
          style={[s.input, icon ? { paddingLeft: 8 } : null]}
          placeholder={placeholder}
          placeholderTextColor="#A8949B"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={
            keyboardType === "email-address"
              ? "none"
              : secureTextEntry
              ? "none"
              : "sentences"
          }
          autoCorrect={false}
        />
      </View>
    </View>
  );
}

function Brand() {
  return (
    <View style={s.brand}>
      <View style={s.brandRow}>
        <Text style={s.brandName}>TripBuddies</Text>
        <View style={s.brandDot} />
      </View>
      <Text style={s.brandTagline}>
        Travel together, closer forever ♡
      </Text>
    </View>
  );
}

function Duck({ style }) {
  return (
    <Image
      source={require("./assets/Duck.png")}
      style={style}
      resizeMode="contain"
    />
  );
}

function BackHeader({ onPress, title = "" }) {
  return (
    <View style={s.header}>
      <TouchableOpacity
        onPress={onPress}
        style={s.backButton}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="chevron-back" size={20} color={C.text} />
      </TouchableOpacity>

      <Text style={s.headerTitle}>{title}</Text>

      <View style={{ width: 40 }} />
    </View>
  );
}

// ==========================================
// 4. MAIN APP
// ==========================================

export default function App() {
  const [fontsLoaded] = useFonts({
    Prompt_400Regular,
    Prompt_500Medium,
    Prompt_600SemiBold,
    Prompt_700Bold,
  });

  // ----------------------------------------
  // SCREEN
  // ----------------------------------------

  const [screen, setScreen] = useState("landing");
  const [tab, setTab] = useState("home");

  // ----------------------------------------
  // USER
  // ----------------------------------------

  const [userId, setUserId] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [phone, setPhone] = useState("");
  const [currency, setCurrency] = useState("บาท (THB)");

  // ----------------------------------------
  // APPLICATION
  // ----------------------------------------

  const [busy, setBusy] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // ----------------------------------------
  // GROUPS
  // ----------------------------------------

  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [members, setMembers] = useState([]);

  const [groupName, setGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [memberEmail, setMemberEmail] = useState("");

  const [groupModal, setGroupModal] = useState(false);
  const [groupActionBusy, setGroupActionBusy] = useState(false);

  // ----------------------------------------
  // TRIPS
  // ----------------------------------------

  const [trips, setTrips] = useState([]);
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  const [tripModal, setTripModal] = useState(false);
  const [tripTitle, setTripTitle] = useState("");
  const [tripDestination, setTripDestination] = useState("");
  const [tripBudget, setTripBudget] = useState("");

  const [expenseModal, setExpenseModal] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseTripId, setExpenseTripId] = useState(null);
  const [expensePayer, setExpensePayer] = useState(null);
  const [expenseParticipants, setExpenseParticipants] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [tripExpenses, setTripExpenses] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [detailTab, setDetailTab] = useState("expenses"); // "expenses" | "settlement"
  const [groupSwitcherModal, setGroupSwitcherModal] = useState(false);

  const [memberNicknames, setMemberNicknames] = useState({});
  const [editingMember, setEditingMember] = useState(null);
  const [editingNickInput, setEditingNickInput] = useState("");

  // Sub-items & Itemized Food expense states
  const [splitMode, setSplitMode] = useState("equal"); // "equal" | "itemized"
  const [expenseItems, setExpenseItems] = useState([]); // [{ id, name, amount, participants }]
  const [expandedExpenses, setExpandedExpenses] = useState({}); // { [expId]: boolean }

  // QR Code & Payment states
  const [userQrData, setUserQrData] = useState(null); // { promptpay, bankName, accountName, qrUri, base64 }
  const [memberQrMap, setMemberQrMap] = useState({}); // { [userId]: { promptpay, bankName, accountName, qrUri, base64 } }
  const [viewingQrModal, setViewingQrModal] = useState(null); // { userId, name, amount, promptpay, bankName, accountName, qrUri }
  const [qrSetupModal, setQrSetupModal] = useState(false);
  const [qrSetupTarget, setQrSetupTarget] = useState(null); // { userId, name }
  const [qrInputPromptPay, setQrInputPromptPay] = useState("");
  const [qrInputBankName, setQrInputBankName] = useState("");
  const [qrInputAccountName, setQrInputAccountName] = useState("");
  const [qrImageUri, setQrImageUri] = useState("");
  const [qrImageBase64, setQrImageBase64] = useState("");

  useEffect(() => {
    AsyncStorage.getItem("@tb_member_nicknames").then((raw) => {
      if (raw) {
        try {
          setMemberNicknames(JSON.parse(raw));
        } catch {}
      }
    });

    AsyncStorage.getItem("@tb_member_qr_map").then((raw) => {
      if (raw) {
        try {
          setMemberQrMap(JSON.parse(raw));
        } catch {}
      }
    });
  }, []);

  // ========================================
  // 5. CHECK SUPABASE
  // ========================================

  const checkSupabase = () => {
    if (
      !SUPABASE_URL.startsWith("https://") ||
      !SUPABASE_PUBLISHABLE_KEY
    ) {
      Alert.alert(
        "Supabase Error",
        "กรุณาตรวจสอบ Supabase URL และ Publishable Key"
      );

      return false;
    }

    return true;
  };

  // ========================================
  // 6. LOAD TRIPS
  // ========================================

  const loadTrips = async (uid, groupId) => {
    if (!uid || !groupId) {
      setTrips([]);
      setTotalBudget(0);
      setTotalSpent(0);
      return;
    }

    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.log("Load trips error:", error.message);

      Alert.alert(
        "โหลดทริปไม่สำเร็จ",
        error.message
      );

      return;
    }

    const tripList = data || [];

    setTrips(tripList);

    const budget = tripList.reduce(
      (sum, trip) =>
        sum + Number(trip.budget || 0),
      0
    );

    setTotalBudget(budget);

    if (tripList.length === 0) {
      setTotalSpent(0);
      return;
    }

    const tripIds = tripList.map(
      (trip) => trip.id
    );

    const { data: expenses, error: expenseError } =
      await supabase
        .from("expenses")
        .select("amount, trip_id")
        .in("trip_id", tripIds);

    if (expenseError) {
      console.log(
        "Load expenses error:",
        expenseError.message
      );

      return;
    }

    const spent = (expenses || []).reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );

    setTotalSpent(spent);
  };

  // ========================================
  // 7. LOAD GROUPS
  // ========================================

  const loadGroups = async (uid) => {
    if (!uid) return [];

    const { data: memberships, error } =
      await supabase
        .from("group_members")
        .select("group_id, role")
        .eq("user_id", uid);

    if (error) {
      console.log(
        "Load memberships error:",
        error.message
      );

      Alert.alert(
        "โหลดกลุ่มไม่สำเร็จ",
        error.message
      );

      return [];
    }

    const groupIds = (memberships || []).map(
      (item) => item.group_id
    );

    if (groupIds.length === 0) {
      setGroups([]);
      setActiveGroup(null);
      setMembers([]);
      setTrips([]);
      setTotalBudget(0);
      setTotalSpent(0);

      return [];
    }

    const { data: groupData, error: groupError } =
      await supabase
        .from("groups")
        .select("*")
        .in("id", groupIds)
        .order("created_at", {
          ascending: false,
        });

    if (groupError) {
      console.log(
        "Load groups error:",
        groupError.message
      );

      Alert.alert(
        "โหลดข้อมูลกลุ่มไม่สำเร็จ",
        groupError.message
      );

      return [];
    }

    const result = (groupData || []).map(
      (group) => ({
        ...group,
        role:
          memberships.find(
            (m) => m.group_id === group.id
          )?.role || "member",
      })
    );

    setGroups(result);

    return result;
  };

  // ========================================
  // 8. LOAD MEMBERS
  // ========================================

  const loadMembers = async (groupId) => {
    if (!groupId) {
      setMembers([]);
      return;
    }

    const { data, error } = await supabase
      .from("group_members")
      .select("user_id, role, joined_at")
      .eq("group_id", groupId);

    if (error) {
      Alert.alert(
        "โหลดสมาชิกไม่สำเร็จ",
        error.message
      );

      return;
    }

    const userIds = (data || []).map(
      (item) => item.user_id
    );

    if (userIds.length === 0) {
      setMembers([]);
      return;
    }

    const { data: profiles, error: profileError } =
      await supabase
        .from("profiles")
        .select("id, full_name, phone")
        .in("id", userIds);

    if (profileError) {
      console.log(
        "Load member profiles error:",
        profileError.message
      );
    }

    if (profiles && profiles.length > 0) {
      setMemberQrMap((prev) => {
        const next = { ...prev };
        profiles.forEach((p) => {
          if (p.phone) {
            try {
              if (p.phone.startsWith("{")) {
                const parsed = JSON.parse(p.phone);
                next[p.id] = {
                  ...next[p.id],
                  promptpay: parsed.promptpay || parsed.phone || "",
                  bankName: parsed.bankName || "",
                  accountName: parsed.accountName || "",
                  qrUri: parsed.qr || "",
                  base64: parsed.qr || "",
                };
              } else if (!next[p.id]?.promptpay) {
                next[p.id] = {
                  ...next[p.id],
                  promptpay: p.phone,
                };
              }
            } catch {
              if (!next[p.id]?.promptpay) {
                next[p.id] = {
                  ...next[p.id],
                  promptpay: p.phone,
                };
              }
            }
          }
        });
        return next;
      });
    }

    const result = (data || []).map(
      (member) => ({
        ...member,
        profile: (profiles || []).find(
          (p) => p.id === member.user_id
        ),
      })
    );

    setMembers(result);
  };

  // ========================================
  // 9. SELECT GROUP
  // ========================================

  const selectGroup = async (group) => {
    if (!group) return;

    setActiveGroup(group);

    await loadMembers(group.id);
    await loadTrips(userId, group.id);
  };

  // ========================================
  // 10. CREATE GROUP
  // ========================================

  const createGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert(
        "ข้อมูลไม่ครบ",
        "กรุณากรอกชื่อกลุ่ม"
      );

      return;
    }

    setGroupActionBusy(true);

    try {
      const { data, error } = await supabase.rpc(
        "create_group",
        {
          p_name: groupName.trim(),
        }
      );

      if (error) throw error;

      const loadedGroups = await loadGroups(userId);

      const newGroup = loadedGroups.find(
        (group) => group.id === data
      );

      if (newGroup) {
        await selectGroup(newGroup);
      }

      setGroupName("");
      setGroupModal(false);

      Alert.alert(
        "สำเร็จ!",
        "สร้างกลุ่มเรียบร้อยแล้ว"
      );
    } catch (error) {
      Alert.alert(
        "สร้างกลุ่มไม่สำเร็จ",
        error.message
      );
    } finally {
      setGroupActionBusy(false);
    }
  };

  // ========================================
  // 11. JOIN GROUP
  // ========================================

  const joinGroup = async () => {
    if (!joinCode.trim()) {
      Alert.alert(
        "ข้อมูลไม่ครบ",
        "กรุณากรอกรหัสเชิญ"
      );

      return;
    }

    setGroupActionBusy(true);

    try {
      const { data, error } = await supabase.rpc(
        "join_group_by_code",
        {
          p_invite_code: joinCode.trim(),
        }
      );

      if (error) throw error;

      const loadedGroups = await loadGroups(userId);

      const joinedGroup = loadedGroups.find(
        (group) => group.id === data
      );

      if (joinedGroup) {
        await selectGroup(joinedGroup);
      }

      setJoinCode("");

      Alert.alert(
        "สำเร็จ!",
        "เข้าร่วมกลุ่มเรียบร้อยแล้ว"
      );
    } catch (error) {
      Alert.alert(
        "เข้าร่วมกลุ่มไม่สำเร็จ",
        error.message
      );
    } finally {
      setGroupActionBusy(false);
    }
  };

  // ========================================
  // 12. ADD MEMBER BY EMAIL
  // ========================================

  const addMember = async () => {
    if (!activeGroup) {
      Alert.alert(
        "ยังไม่ได้เลือกกลุ่ม",
        "กรุณาเลือกกลุ่มก่อน"
      );

      return;
    }

    if (!memberEmail.trim()) {
      Alert.alert(
        "ข้อมูลไม่ครบ",
        "กรุณากรอกอีเมลสมาชิก"
      );

      return;
    }

    setGroupActionBusy(true);

    try {
      const { error } = await supabase.rpc(
        "add_group_member_by_email",
        {
          p_group_id: activeGroup.id,
          p_email: memberEmail.trim(),
        }
      );

      if (error) throw error;

      setMemberEmail("");

      await loadMembers(activeGroup.id);

      Alert.alert(
        "สำเร็จ!",
        "เพิ่มสมาชิกเรียบร้อยแล้ว"
      );
    } catch (error) {
      Alert.alert(
        "เพิ่มสมาชิกไม่สำเร็จ",
        error.message
      );
    } finally {
      setGroupActionBusy(false);
    }
  };

  // ========================================
  // 13. LOAD USER DATA
  // ========================================

  const loadUserData = async (user) => {
    setUserId(user.id);
    setEmail(user.email || "");

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.log(
        "Profile loading error:",
        error.message
      );
    }

    const resolvedName =
      data?.full_name ||
      user.user_metadata?.full_name ||
      name ||
      "";

    setName(resolvedName);

    if (resolvedName) {
      try {
        await supabase.from("profiles").upsert({
          id: user.id,
          full_name: resolvedName,
          phone: data?.phone || user.user_metadata?.phone || phone || "",
          currency: currency.includes("USD") ? "USD" : "THB",
        });
      } catch (err) {
        console.log("Sync profile error:", err);
      }
    }

    try {
      const localQr = await AsyncStorage.getItem(`@tb_user_qr_${user.id}`);
      if (localQr) {
        const parsed = JSON.parse(localQr);
        setUserQrData(parsed);
        setMemberQrMap((prev) => ({ ...prev, [user.id]: parsed }));
      }
    } catch {}

    let extractedPhone = data?.phone || "";
    if (data?.phone) {
      try {
        if (data.phone.startsWith("{")) {
          const parsed = JSON.parse(data.phone);
          const combined = {
            promptpay: parsed.promptpay || parsed.phone || "",
            bankName: parsed.bankName || "",
            accountName: parsed.accountName || "",
            qrUri: parsed.qr || "",
            base64: parsed.qr || "",
          };
          setUserQrData((prev) => prev || combined);
          setMemberQrMap((prev) => ({ ...prev, [user.id]: combined }));
          extractedPhone = parsed.promptpay || parsed.phone || "";
        }
      } catch {}
    }

    setPhone(extractedPhone);

    setCurrency(
      data?.currency === "USD"
        ? "ดอลลาร์ (USD)"
        : "บาท (THB)"
    );

    const loadedGroups = await loadGroups(user.id);

    if (loadedGroups.length > 0) {
      const firstGroup = loadedGroups[0];

      setActiveGroup(firstGroup);

      await loadMembers(firstGroup.id);
      await loadTrips(user.id, firstGroup.id);
    } else {
      setActiveGroup(null);
      setMembers([]);
      setTrips([]);
      setTotalBudget(0);
      setTotalSpent(0);
    }

    setTab("home");
    setScreen("home");
  };

  // ========================================
  // 14. RESTORE SESSION
  // ========================================

  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      try {
        const { data, error } =
          await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.log(
            "Restore session error:",
            error.message
          );
        }

        if (data.session?.user) {
          await loadUserData(data.session.user);

          if (!mounted) return;
        }
      } catch (error) {
        console.log(
          "Session error:",
          error.message
        );
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    };

    restoreSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_OUT" && mounted) {
          setUserId(null);
          setName("");
          setEmail("");
          setPassword("");
          setConfirm("");
          setPhone("");

          setGroups([]);
          setActiveGroup(null);
          setMembers([]);

          setTrips([]);
          setTotalBudget(0);
          setTotalSpent(0);

          setTab("home");
          setScreen("welcome");
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ========================================
  // 15. AUTO REFRESH TOKEN
  // ========================================

  useEffect(() => {
    if (Platform.OS === "web") return;

    const subscription = AppState.addEventListener(
      "change",
      (state) => {
        if (state === "active") {
          supabase.auth.startAutoRefresh();
        } else {
          supabase.auth.stopAutoRefresh();
        }
      }
    );

    return () => subscription.remove();
  }, []);

  // ========================================
  // 16. NAVIGATION
  // ========================================

  const goHome = () => {
    Keyboard.dismiss();

    setTab("home");
    setScreen("home");
  };

  const goBack = () => {
    Keyboard.dismiss();

    if (screen === "register") {
      setScreen("welcome");
    } else {
      setScreen("landing");
    }
  };

  const nav = (next) => {
    Keyboard.dismiss();

    setTab(next);
    setScreen(next);
  };

  // ========================================
  // 17. LOGIN
  // ========================================

  const login = async () => {
    if (!checkSupabase()) return;

    if (!email.trim() || !password) {
      Alert.alert(
        "ข้อมูลไม่ครบ",
        "กรุณากรอกอีเมลและรหัสผ่าน"
      );

      return;
    }

    Keyboard.dismiss();
    setBusy(true);

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) throw error;

      if (!data.user) {
        throw new Error("ไม่พบข้อมูลผู้ใช้");
      }

      await loadUserData(data.user);
    } catch (error) {
      Alert.alert(
        "เข้าสู่ระบบไม่สำเร็จ",
        error.message
      );
    } finally {
      setBusy(false);
    }
  };

  // ========================================
  // 18. REGISTER
  // ========================================

  const register = async () => {
    if (!checkSupabase()) return;

    Keyboard.dismiss();

    if (
      !name.trim() ||
      !email.trim() ||
      !password ||
      !confirm
    ) {
      Alert.alert(
        "ข้อมูลไม่ครบ",
        "กรุณากรอกข้อมูลให้ครบทุกช่อง"
      );

      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "รหัสผ่านสั้นเกินไป",
        "กรุณาใช้รหัสผ่านอย่างน้อย 6 ตัวอักษร"
      );

      return;
    }

    if (password !== confirm) {
      Alert.alert(
        "รหัสผ่านไม่ตรงกัน",
        "กรุณากรอกรหัสผ่านให้ตรงกัน"
      );

      return;
    }

    setBusy(true);

    try {
      const { data, error } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: name.trim(),
              phone: phone.trim(),
              currency: currency.includes("USD")
                ? "USD"
                : "THB",
            },
          },
        });

      if (error) throw error;

      if (data.session && data.user) {
        if (name.trim()) {
          try {
            await supabase.from("profiles").upsert({
              id: data.user.id,
              full_name: name.trim(),
              phone: phone.trim(),
              currency: currency.includes("USD") ? "USD" : "THB",
            });
          } catch (e) {
            console.log("Upsert on signup error:", e);
          }
        }
        await loadUserData(data.user);
      } else {
        // Try to auto-login immediately without requiring email verification
        const autoLogin = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (autoLogin.data?.session && autoLogin.data?.user) {
          if (name.trim()) {
            try {
              await supabase.from("profiles").upsert({
                id: autoLogin.data.user.id,
                full_name: name.trim(),
                phone: phone.trim(),
                currency: currency.includes("USD") ? "USD" : "THB",
              });
            } catch (e) {
              console.log("Upsert on signup error:", e);
            }
          }
          await loadUserData(autoLogin.data.user);
        } else {
          if (data.user) {
            try {
              await supabase.from("profiles").upsert({
                id: data.user.id,
                full_name: name.trim(),
                phone: phone.trim(),
                currency: currency.includes("USD") ? "USD" : "THB",
              });
            } catch (e) {
              console.log("Upsert on signup error:", e);
            }
          }

          Alert.alert(
            "สมัครสมาชิกสำเร็จ",
            "สร้างบัญชีเรียบร้อยแล้ว เข้าสู่ระบบได้ทันที",
            [
              {
                text: "เข้าสู่ระบบ",
                onPress: () => {
                  setScreen("login");
                },
              },
            ]
          );
        }
      }
    } catch (error) {
      if (
        error.message?.includes("rate limit") ||
        error.message?.includes("over_email_send_rate_limit")
      ) {
        // If email rate limit was triggered, try logging in in case account is already created
        const fallbackLogin = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (fallbackLogin.data?.session && fallbackLogin.data?.user) {
          await loadUserData(fallbackLogin.data.user);
          return;
        }

        Alert.alert(
          "สมัครสมาชิกล่าช้า (Email Rate Limit)",
          "ระบบส่งอีเมลของ Supabase ถึงลิมิตฟรี แนะนำให้เข้าไปปิด 'Confirm email' ใน Supabase Dashboard (Auth > Providers > Email) เพื่อให้สมัครแล้วเข้าได้ทันที 100% โดยไม่ต้องส่งอีเมลครับ"
        );
      } else {
        Alert.alert(
          "สมัครสมาชิกไม่สำเร็จ",
          error.message
        );
      }
    } finally {
      setBusy(false);
    }
  };

  // ========================================
  // 19. LOGOUT
  // ========================================

  const logout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      Alert.alert(
        "ออกจากระบบไม่สำเร็จ",
        error.message
      );

      return;
    }

    setScreen("welcome");
    setTab("home");
  };

  // ========================================
  // 20. CREATE TRIP
  // ========================================

  const createTrip = () => {
    if (!userId) {
      Alert.alert(
        "กรุณาเข้าสู่ระบบ",
        "ต้องเข้าสู่ระบบก่อนสร้างทริป"
      );

      return;
    }

    if (!activeGroup) {
      Alert.alert(
        "ต้องสร้างกลุ่มก่อน",
        "กรุณาสร้างกลุ่มหรือเข้าร่วมกลุ่มก่อน จึงจะสามารถสร้างทริปได้",
        [
          {
            text: "ยกเลิก",
            style: "cancel",
          },
          {
            text: "ไปหน้ากลุ่ม",
            onPress: () => nav("groups"),
          },
        ]
      );

      return;
    }

    setTripTitle("");
    setTripDestination("");
    setTripBudget("");

    setTripModal(true);
  };

  // ========================================
  // 21. SAVE TRIP
  // ========================================

  const saveTrip = async () => {
    if (!activeGroup) {
      Alert.alert(
        "ไม่พบกลุ่ม",
        "กรุณาเลือกกลุ่มก่อนสร้างทริป"
      );

      return;
    }

    if (!tripTitle.trim()) {
      Alert.alert(
        "ข้อมูลไม่ครบ",
        "กรุณากรอกชื่อทริป"
      );

      return;
    }

    setBusy(true);

    try {
      const { error } = await supabase
        .from("trips")
        .insert({
          title: tripTitle.trim(),
          destination: tripDestination.trim(),
          budget: 0,
          currency: currency.includes("USD")
            ? "USD"
            : "THB",
          created_by: userId,
          group_id: activeGroup.id,
        });

      if (error) throw error;

      setTripModal(false);

      await loadTrips(userId, activeGroup.id);

      Alert.alert(
        "สำเร็จ!",
        "บันทึกทริปลงในกลุ่มเรียบร้อยแล้ว"
      );
    } catch (error) {
      Alert.alert(
        "สร้างทริปไม่สำเร็จ",
        error.message
      );
    } finally {
      setBusy(false);
    }
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "สวัสดีตอนเช้า ☀️";
    if (hour < 17) return "สวัสดีตอนบ่าย 🌤️";
    return "สวัสดีตอนเย็น 🌙";
  };

  // ----------------------------------------
  // EXPENSE & SETTLEMENT HELPERS
  // ----------------------------------------

  const parseExpense = (exp) => {
    let title = "ค่าใช้จ่าย";
    let payer = exp?.paid_by;
    let participants = [];
    let splitType = "equal";
    let items = [];
    let notes = "";
    if (exp?.description) {
      try {
        if (exp.description.startsWith("{")) {
          const parsed = JSON.parse(exp.description);
          title = parsed.title || parsed.name || exp.description;
          if (parsed.payer) {
            payer = parsed.payer;
          }
          participants = Array.isArray(parsed.participants) ? parsed.participants : [];
          splitType = parsed.splitType || (parsed.items?.length > 0 ? "itemized" : "equal");
          items = Array.isArray(parsed.items) ? parsed.items : [];
          notes = parsed.notes || "";
        } else {
          title = exp.description;
        }
      } catch {
        title = exp.description;
      }
    }
    return {
      ...exp,
      title,
      paid_by: payer,
      participants,
      splitType,
      items,
      notes,
    };
  };

  const getMemberName = (mId) => {
    if (mId === userId) {
      return name ? `${name} (ฉัน)` : "ฉัน";
    }
    const found = members.find((m) => m.user_id === mId);
    if (found?.profile?.full_name) {
      return found.profile.full_name;
    }
    if (memberNicknames && memberNicknames[mId]) {
      return memberNicknames[mId];
    }
    if (found) {
      const idx = members.findIndex((m) => m.user_id === mId);
      if (found.role === "owner") return "เจ้าของกลุ่ม 👑";
      return `เพื่อนคนที่ ${idx + 1}`;
    }
    return "เพื่อนในกลุ่ม";
  };

  const saveMemberNickname = async (targetUserId, newName) => {
    if (!newName || !newName.trim()) return;
    const clean = newName.trim();
    const updated = {
      ...memberNicknames,
      [targetUserId]: clean,
    };
    setMemberNicknames(updated);
    try {
      await AsyncStorage.setItem("@tb_member_nicknames", JSON.stringify(updated));
    } catch (e) {
      console.log("Save nickname error:", e);
    }

    try {
      await supabase.from("profiles").upsert({
        id: targetUserId,
        full_name: clean,
      });
    } catch (e) {
      console.log("Upsert member profile error:", e);
    }

    setEditingMember(null);
    setEditingNickInput("");
    Alert.alert("สำเร็จ", `ตั้งชื่อ "${clean}" เรียบร้อยแล้ว`);
  };

  // ----------------------------------------
  // QR CODE & PROMPTPAY HELPERS
  // ----------------------------------------

  const openQrSetupModal = (targetUserId, targetName) => {
    const tUid = targetUserId || userId;
    const tName = targetName || (tUid === userId ? (name || "ฉัน") : getMemberName(tUid));
    setQrSetupTarget({ userId: tUid, name: tName });
    const existing = memberQrMap[tUid] || (tUid === userId ? userQrData : null);
    setQrInputPromptPay(existing?.promptpay || "");
    setQrInputBankName(existing?.bankName || "");
    setQrInputAccountName(existing?.accountName || "");
    setQrImageUri(existing?.qrUri || existing?.uri || "");
    setQrImageBase64(existing?.base64 || "");
    setQrSetupModal(true);
  };

  const pickQrImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "ขอสิทธิ์เข้าถึงรูปภาพ",
          "กรุณาอนุญาตให้แอปเข้าถึงคลังรูปภาพเพื่อเลือกรูป QR Code"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setQrImageUri(asset.uri);
        const b64 = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setQrImageBase64(b64);
      }
    } catch (err) {
      console.log("Pick image error:", err);
      Alert.alert("ไม่สามารถเลือกรูปได้", err.message || "เกิดข้อผิดพลาด");
    }
  };

  const saveQrData = async () => {
    if (!qrSetupTarget) return;
    const tUid = qrSetupTarget.userId;
    const tName = qrSetupTarget.name;

    const cleanPromptPay = qrInputPromptPay.trim();
    if (!cleanPromptPay && !qrImageBase64 && !qrImageUri) {
      Alert.alert(
        "ข้อมูลไม่ครบ",
        "กรุณากรอกเบอร์พร้อมเพย์ หรืออัปโหลดรูป QR Code"
      );
      return;
    }

    setBusy(true);
    try {
      const qrObj = {
        promptpay: cleanPromptPay,
        bankName: qrInputBankName.trim(),
        accountName: qrInputAccountName.trim(),
        qrUri: qrImageUri || "",
        base64: qrImageBase64 || "",
        updatedAt: new Date().toISOString(),
      };

      const updatedMap = {
        ...memberQrMap,
        [tUid]: qrObj,
      };
      setMemberQrMap(updatedMap);

      if (tUid === userId) {
        setUserQrData(qrObj);
        setPhone(cleanPromptPay);
        await AsyncStorage.setItem(`@tb_user_qr_${tUid}`, JSON.stringify(qrObj));
      }
      await AsyncStorage.setItem("@tb_member_qr_map", JSON.stringify(updatedMap));

      // Sync to profiles table in Supabase
      try {
        const payloadToStore = JSON.stringify({
          promptpay: cleanPromptPay,
          bankName: qrInputBankName.trim(),
          accountName: qrInputAccountName.trim(),
          qr: qrImageBase64 || qrImageUri || "",
        });

        const { error } = await supabase.from("profiles").upsert({
          id: tUid,
          full_name: tName,
          phone: payloadToStore,
        });

        if (error) {
          await supabase.from("profiles").upsert({
            id: tUid,
            full_name: tName,
            phone: cleanPromptPay,
          });
        }
      } catch (e) {
        console.log("Sync QR to supabase error:", e);
      }

      setQrSetupModal(false);
      Alert.alert("สำเร็จ!", `บันทึกข้อมูล QR Code ของ ${tName} เรียบร้อยแล้ว`);
    } catch (err) {
      Alert.alert("บันทึกไม่สำเร็จ", err.message || "เกิดข้อผิดพลาด");
    } finally {
      setBusy(false);
    }
  };

  const removeQrData = async (targetUserId) => {
    const tUid = targetUserId || userId;
    Alert.alert("ยืนยัน", "ต้องการลบ QR Code และข้อมูลการรับเงินหรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ลบข้อมูล",
        style: "destructive",
        onPress: async () => {
          const updated = { ...memberQrMap };
          delete updated[tUid];
          setMemberQrMap(updated);
          if (tUid === userId) {
            setUserQrData(null);
            await AsyncStorage.removeItem(`@tb_user_qr_${tUid}`);
          }
          await AsyncStorage.setItem("@tb_member_qr_map", JSON.stringify(updated));
          try {
            await supabase.from("profiles").upsert({
              id: tUid,
              phone: "",
            });
          } catch {}
          Alert.alert("สำเร็จ", "ลบข้อมูล QR Code เรียบร้อยแล้ว");
        },
      },
    ]);
  };

  // ----------------------------------------
  // SUB-ITEMS & FOOD EXPENSE HELPERS
  // ----------------------------------------

  const addExpenseSubItem = () => {
    setExpenseItems((prev) => [
      ...prev,
      {
        id: "item_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        name: "",
        amount: "",
        participants: members.map((m) => m.user_id),
      },
    ]);
  };

  const removeExpenseSubItem = (itemId) => {
    if (expenseItems.length <= 1) {
      Alert.alert("แจ้งเตือน", "ต้องมีรายการอาหารอย่างน้อย 1 เมนู");
      return;
    }
    setExpenseItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const updateExpenseSubItem = (itemId, field, value) => {
    setExpenseItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, [field]: value } : item))
    );
  };

  const toggleSubItemParticipant = (itemId, pId) => {
    setExpenseItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const exists = item.participants.includes(pId);
        const nextParticipants = exists
          ? item.participants.filter((id) => id !== pId)
          : [...item.participants, pId];
        return { ...item, participants: nextParticipants };
      })
    );
  };

  const toggleSubItemSelectAll = (itemId) => {
    setExpenseItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const allSelected = item.participants.length === members.length;
        return {
          ...item,
          participants: allSelected ? [] : members.map((m) => m.user_id),
        };
      })
    );
  };

  const toggleExpenseAccordion = (expId) => {
    setExpandedExpenses((prev) => ({
      ...prev,
      [expId]: !prev[expId],
    }));
  };

  const calculateSettlement = (expensesList, membersList) => {
    const net = {};
    const paidTotals = {};
    const owedTotals = {};

    membersList.forEach((m) => {
      net[m.user_id] = 0;
      paidTotals[m.user_id] = 0;
      owedTotals[m.user_id] = 0;
    });

    expensesList.forEach((exp) => {
      const amt = Number(exp.amount) || 0;
      if (amt <= 0) return;

      const payer = exp.paid_by;

      if (net[payer] !== undefined) {
        net[payer] += amt;
        paidTotals[payer] = (paidTotals[payer] || 0) + amt;
      } else {
        net[payer] = amt;
        paidTotals[payer] = amt;
      }

      if (exp.splitType === "itemized" && Array.isArray(exp.items) && exp.items.length > 0) {
        exp.items.forEach((it) => {
          const itAmt = Number(it.amount) || 0;
          if (itAmt <= 0) return;
          const itParts =
            it.participants && it.participants.length > 0
              ? it.participants
              : [payer];
          const itShare = itAmt / itParts.length;
          itParts.forEach((pId) => {
            if (net[pId] !== undefined) {
              net[pId] -= itShare;
              owedTotals[pId] = (owedTotals[pId] || 0) + itShare;
            } else {
              net[pId] = -itShare;
              owedTotals[pId] = itShare;
            }
          });
        });
      } else {
        const participants =
          exp.participants && exp.participants.length > 0
            ? exp.participants
            : membersList.map((m) => m.user_id);

        if (participants.length === 0) return;

        const share = amt / participants.length;
        participants.forEach((pId) => {
          if (net[pId] !== undefined) {
            net[pId] -= share;
            owedTotals[pId] = (owedTotals[pId] || 0) + share;
          } else {
            net[pId] = -share;
            owedTotals[pId] = share;
          }
        });
      }
    });

    const creditors = [];
    const debtors = [];

    Object.keys(net).forEach((uid) => {
      const balance = Math.round(net[uid] * 100) / 100;
      if (balance > 0.01) {
        creditors.push({ userId: uid, amount: balance });
      } else if (balance < -0.01) {
        debtors.push({ userId: uid, amount: -balance });
      }
    });

    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const transfers = [];
    let i = 0;
    let j = 0;

    const debtorList = debtors.map((d) => ({ ...d }));
    const creditorList = creditors.map((c) => ({ ...c }));

    while (i < debtorList.length && j < creditorList.length) {
      const debtor = debtorList[i];
      const creditor = creditorList[j];
      const transferAmt = Math.min(debtor.amount, creditor.amount);

      if (transferAmt > 0.01) {
        transfers.push({
          from: debtor.userId,
          to: creditor.userId,
          amount: Math.round(transferAmt * 100) / 100,
        });
      }

      debtor.amount -= transferAmt;
      creditor.amount -= transferAmt;

      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    return { net, paidTotals, owedTotals, transfers };
  };

  const loadTripExpenses = async (tripId) => {
    if (!tripId) return;
    setLoadingExpenses(true);
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("id, trip_id, amount, paid_by, description, created_at")
        .eq("trip_id", tripId)
        .order("created_at", { ascending: false });

      if (error) {
        console.log("Load expenses error:", error.message);
        return;
      }

      const parsed = (data || []).map(parseExpense);
      setTripExpenses(parsed);
    } catch (err) {
      console.log("Error loading expenses:", err);
    } finally {
      setLoadingExpenses(false);
    }
  };

  const openTripDetail = async (trip) => {
    if (!trip) return;
    setSelectedTrip(trip);
    setExpenseTripId(trip.id);
    setDetailTab("expenses");
    setScreen("tripDetail");
    await loadTripExpenses(trip.id);
  };

  const openExpenseModal = (targetTripId) => {
    const tid = targetTripId || selectedTrip?.id || (trips[0] && trips[0].id);
    if (!tid) {
      if (!activeGroup) {
        Alert.alert("ยังไม่ได้เลือกกลุ่ม", "กรุณาเลือกหรือสร้างกลุ่มก่อนบันทึกค่าใช้จ่าย", [
          { text: "ไปหน้ากลุ่ม", onPress: () => nav("groups") },
          { text: "ยกเลิก", style: "cancel" },
        ]);
      } else {
        Alert.alert("ยังไม่มีทริป", "กรุณาสร้างทริปแรกในกลุ่มก่อนบันทึกค่าใช้จ่าย", [
          { text: "+ สร้างทริป", onPress: createTrip },
          { text: "ยกเลิก", style: "cancel" },
        ]);
      }
      return;
    }
    setExpenseTripId(tid);
    setExpenseTitle("");
    setExpenseAmount("");
    setExpensePayer(userId);
    setExpenseParticipants(members.map((m) => m.user_id));
    setSplitMode("equal");
    setExpenseItems([
      {
        id: "item_" + Date.now(),
        name: "",
        amount: "",
        participants: members.map((m) => m.user_id),
      },
    ]);
    setExpenseModal(true);
  };

  const deleteExpense = (expId, expTitle) => {
    const doDelete = async () => {
      setBusy(true);
      try {
        // Optimistically remove from state immediately for fast response
        setTripExpenses((prev) => prev.filter((item) => item.id !== expId));

        const { error } = await supabase
          .from("expenses")
          .delete()
          .eq("id", expId);

        if (error) {
          console.log("Delete expense error from Supabase:", error.message);
          throw error;
        }

        if (selectedTrip) {
          await loadTripExpenses(selectedTrip.id);
        }
        if (activeGroup) {
          await loadTrips(userId, activeGroup.id);
        }

        Alert.alert("สำเร็จ", "ลบรายการเรียบร้อยแล้ว");
      } catch (err) {
        console.log("Delete expense error:", err);
        if (selectedTrip) {
          await loadTripExpenses(selectedTrip.id);
        }
        Alert.alert(
          "ลบไม่สำเร็จ",
          err.message || "ไม่สามารถลบรายการได้ กรุณาตรวจสอบสิทธิ์ใน Supabase"
        );
      } finally {
        setBusy(false);
      }
    };

    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm) {
        const confirmed = window.confirm(
          `ต้องการลบรายการ "${expTitle || "นี้"}" หรือไม่?`
        );
        if (confirmed) {
          doDelete();
        }
      } else {
        doDelete();
      }
      return;
    }

    Alert.alert(
      "ยืนยันการลบ",
      `ต้องการลบรายการ "${expTitle || "นี้"}" หรือไม่?`,
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ลบรายการ",
          style: "destructive",
          onPress: doDelete,
        },
      ]
    );
  };

  const saveExpense = async () => {
    if (!activeGroup || trips.length === 0) {
      Alert.alert(
        "ไม่พบทริป",
        "กรุณาสร้างหรือเลือกทริปในกลุ่มก่อนบันทึกค่าใช้จ่าย"
      );
      return;
    }

    if (!expenseTitle.trim()) {
      Alert.alert("ข้อมูลไม่ครบ", "กรุณาระบุชื่อรายการหรือชื่อร้านอาหาร");
      return;
    }

    const targetTripId = expenseTripId || selectedTrip?.id || (trips[0] && trips[0].id);
    if (!targetTripId) {
      Alert.alert("ไม่พบทริป", "กรุณาเลือกทริปที่ต้องการบันทึก");
      return;
    }

    const payer = expensePayer || userId;
    let amt = 0;
    let payload = {};

    if (splitMode === "itemized") {
      if (expenseItems.length === 0) {
        Alert.alert("ข้อมูลไม่ครบ", "กรุณาเพิ่มอย่างน้อย 1 รายการอาหาร");
        return;
      }

      for (let i = 0; i < expenseItems.length; i++) {
        const it = expenseItems[i];
        if (!it.name.trim()) {
          Alert.alert("ข้อมูลไม่ครบ", `กรุณาระบุชื่อเมนูสำหรับรายการที่ ${i + 1}`);
          return;
        }
        const itPrice = Number(String(it.amount).replace(/,/g, "")) || 0;
        if (itPrice <= 0) {
          Alert.alert(
            "ราคาไม่ถูกต้อง",
            `กรุณากรอกราคาของเมนู "${it.name.trim()}" มากกว่า 0`
          );
          return;
        }
        if (!it.participants || it.participants.length === 0) {
          Alert.alert(
            "ไม่มีผู้ร่วมหาร",
            `กรุณาเลือกเพื่อนที่กินเมนู "${it.name.trim()}" อย่างน้อย 1 คน`
          );
          return;
        }
        amt += itPrice;
      }

      const allParticipants = Array.from(
        new Set(expenseItems.flatMap((it) => it.participants))
      );

      payload = {
        title: expenseTitle.trim(),
        payer: payer,
        participants: allParticipants,
        splitType: "itemized",
        items: expenseItems.map((it) => ({
          id: it.id,
          name: it.name.trim(),
          amount: Number(String(it.amount).replace(/,/g, "")) || 0,
          participants: it.participants,
        })),
      };
    } else {
      amt = Number(expenseAmount.replace(/,/g, "")) || 0;
      if (amt <= 0) {
        Alert.alert(
          "จำนวนเงินไม่ถูกต้อง",
          "กรุณากรอกจำนวนเงินมากกว่า 0"
        );
        return;
      }

      const participants =
        expenseParticipants.length > 0
          ? expenseParticipants
          : members.map((m) => m.user_id);

      payload = {
        title: expenseTitle.trim(),
        payer: payer,
        participants,
        splitType: "equal",
      };
    }

    setBusy(true);

    try {
      let { error } = await supabase.from("expenses").insert({
        description: JSON.stringify(payload),
        amount: amt,
        paid_by: payer,
        trip_id: targetTripId,
      });

      if (
        error &&
        (error.code === "42501" ||
          error.message?.includes("row-level security") ||
          error.message?.includes("policy"))
      ) {
        console.log("RLS policy fallback for payer:", payer);
        const fallback = await supabase.from("expenses").insert({
          description: JSON.stringify(payload),
          amount: amt,
          paid_by: userId,
          trip_id: targetTripId,
        });
        error = fallback.error;
      }

      if (error) throw error;

      setExpenseModal(false);
      setExpenseTitle("");
      setExpenseAmount("");
      setExpenseItems([]);

      if (selectedTrip && selectedTrip.id === targetTripId) {
        await loadTripExpenses(targetTripId);
      }
      await loadTrips(userId, activeGroup.id);

      const targetTrip = trips.find((t) => t.id === targetTripId);
      Alert.alert(
        "สำเร็จ!",
        `บันทึกค่าใช้จ่าย ฿${amt.toLocaleString()} ในทริป "${targetTrip?.title || ""}" เรียบร้อยแล้ว`
      );
    } catch (error) {
      Alert.alert("บันทึกไม่สำเร็จ", error.message);
    } finally {
      setBusy(false);
    }
  };

  // ========================================
  // 22. BOTTOM NAVIGATION
  // ========================================

  const bottomNav = () => (
    <>
      <View style={s.bottomNav}>
        {[
          {
            key: "home",
            label: "หน้าแรก",
            activeIcon: "home",
            inactiveIcon: "home-outline",
          },
          {
            key: "groups",
            label: "กลุ่ม",
            activeIcon: "people",
            inactiveIcon: "people-outline",
          },
          {
            key: "expenses",
            label: "บันทึกจ่าย",
            activeIcon: "wallet",
            inactiveIcon: "wallet-outline",
          },
          {
            key: "profile",
            label: "โปรไฟล์",
            activeIcon: "person",
            inactiveIcon: "person-outline",
          },
        ].map((item) => {
          const isActive = tab === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={s.navItem}
              activeOpacity={0.7}
              onPress={() => {
                if (item.key === "expenses") {
                  if (selectedTrip) {
                    openExpenseModal(selectedTrip.id);
                  } else if (trips.length > 0) {
                    openTripDetail(trips[0]);
                  } else if (!activeGroup) {
                    Alert.alert(
                      "ยังไม่ได้เลือกกลุ่ม",
                      "กรุณาเลือกหรือสร้างกลุ่มก่อนบันทึกค่าใช้จ่าย",
                      [
                        { text: "ไปหน้ากลุ่ม", onPress: () => nav("groups") },
                        { text: "ยกเลิก", style: "cancel" },
                      ]
                    );
                  } else {
                    Alert.alert(
                      "ยังไม่มีทริป",
                      "กรุณาสร้างทริปแรกในกลุ่มก่อนบันทึกค่าใช้จ่าย",
                      [
                        { text: "+ สร้างทริป", onPress: createTrip },
                        { text: "ยกเลิก", style: "cancel" },
                      ]
                    );
                  }
                  return;
                }

                nav(item.key);
              }}
            >
              <View
                style={[
                  s.navIconWrapper,
                  isActive && s.navIconWrapperActive,
                ]}
              >
                <Ionicons
                  name={isActive ? item.activeIcon : item.inactiveIcon}
                  size={20}
                  color={isActive ? C.pinkDark : C.muted}
                />
              </View>

              <Text
                style={[
                  s.navLabel,
                  isActive && s.navLabelActive,
                ]}
              >
                {item.label}
              </Text>
              {isActive && <View style={s.navActiveDot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* EXPENSE MODAL */}
      <Modal
        visible={expenseModal}
        transparent
        animationType="fade"
        onRequestClose={() => setExpenseModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={s.modalOverlay}
        >
          <View style={[s.modalCard, { maxHeight: "90%" }]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 10 }}
            >
              <Text style={s.modalTitle}>บันทึกค่าใช้จ่าย</Text>
              <Text style={s.modalSubtitle}>
                {trips.find((t) => t.id === (expenseTripId || selectedTrip?.id || trips[0]?.id))?.title
                  ? `ทริป: ${trips.find((t) => t.id === (expenseTripId || selectedTrip?.id || trips[0]?.id))?.title}`
                  : "บันทึกรายจ่ายสำหรับทริปนี้"}
              </Text>

              {trips.length > 1 && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={s.modalFieldTitle}>เลือกทริป</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ maxHeight: 40 }}
                  >
                    {trips.map((t) => {
                      const isSelected = (expenseTripId || selectedTrip?.id || trips[0]?.id) === t.id;
                      return (
                        <TouchableOpacity
                          key={t.id}
                          onPress={() => setExpenseTripId(t.id)}
                          style={{
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            borderRadius: 16,
                            backgroundColor: isSelected ? C.pink : C.pinkLight,
                            marginRight: 8,
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: "Prompt_500Medium",
                              fontSize: 12,
                              color: isSelected ? C.white : C.text,
                            }}
                          >
                            {t.title}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* SPLIT MODE SELECTOR */}
              <View style={s.splitModeSelector}>
                <TouchableOpacity
                  style={[s.splitModeTab, splitMode === "equal" && s.splitModeTabActive]}
                  onPress={() => setSplitMode("equal")}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="people"
                    size={15}
                    color={splitMode === "equal" ? C.white : C.textMuted}
                  />
                  <Text
                    style={[
                      s.splitModeTabText,
                      splitMode === "equal" && s.splitModeTabTextActive,
                    ]}
                  >
                    หารเท่ากันทุกคน
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    s.splitModeTab,
                    splitMode === "itemized" && s.splitModeTabActive,
                  ]}
                  onPress={() => {
                    setSplitMode("itemized");
                    if (expenseItems.length === 0) {
                      setExpenseItems([
                        {
                          id: "item_" + Date.now(),
                          name: "",
                          amount: "",
                          participants: members.map((m) => m.user_id),
                        },
                      ]);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="restaurant"
                    size={15}
                    color={splitMode === "itemized" ? C.white : C.textMuted}
                  />
                  <Text
                    style={[
                      s.splitModeTabText,
                      splitMode === "itemized" && s.splitModeTabTextActive,
                    ]}
                  >
                    แยกตามเมนูอาหาร 🍲
                  </Text>
                </TouchableOpacity>
              </View>

              <Input
                label={splitMode === "itemized" ? "ชื่อร้าน / ชื่อมื้ออาหาร" : "ชื่อรายการ"}
                placeholder={splitMode === "itemized" ? "เช่น มื้อเย็นร้านป้าสมใจ, ข้าวแกง" : "เช่น ค่าอาหารค่ำ, ค่าน้ำมัน"}
                value={expenseTitle}
                onChangeText={setExpenseTitle}
                icon="receipt-outline"
              />

              {/* EQUAL SPLIT MODE */}
              {splitMode === "equal" && (
                <>
                  <Input
                    label="จำนวนเงิน (บาท)"
                    placeholder="เช่น 1200"
                    value={expenseAmount}
                    onChangeText={setExpenseAmount}
                    keyboardType="decimal-pad"
                    icon="cash-outline"
                  />

                  {/* PARTICIPANTS SPLIT SELECTION */}
                  <View style={{ marginBottom: 14 }}>
                    <View style={s.splitHeaderRow}>
                      <Text style={s.modalFieldTitle}>ใครต้องร่วมหารบ้าง?</Text>
                      <TouchableOpacity
                        onPress={() => {
                          if (expenseParticipants.length === members.length) {
                            setExpenseParticipants([]);
                          } else {
                            setExpenseParticipants(members.map((m) => m.user_id));
                          }
                        }}
                      >
                        <Text style={s.selectAllText}>
                          {expenseParticipants.length === members.length
                            ? "ยกเลิกทั้งหมด"
                            : "เลือกทุกคน"}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={s.participantsGrid}>
                      {members.map((m) => {
                        const isChecked = expenseParticipants.includes(m.user_id);
                        const mName = getMemberName(m.user_id);
                        return (
                          <TouchableOpacity
                            key={m.user_id}
                            style={[
                              s.participantCheckItem,
                              isChecked && s.participantCheckItemActive,
                            ]}
                            activeOpacity={0.75}
                            onPress={() => {
                              if (isChecked) {
                                setExpenseParticipants(
                                  expenseParticipants.filter((id) => id !== m.user_id)
                                );
                              } else {
                                setExpenseParticipants([...expenseParticipants, m.user_id]);
                              }
                            }}
                          >
                            <Ionicons
                              name={isChecked ? "checkbox" : "square-outline"}
                              size={18}
                              color={isChecked ? C.pinkDark : C.muted}
                            />
                            <Text
                              style={[
                                s.participantCheckName,
                                isChecked && s.participantCheckNameActive,
                              ]}
                              numberOfLines={1}
                            >
                              {mName}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* REAL-TIME SPLIT CALCULATION PREVIEW */}
                    {Number(expenseAmount.replace(/,/g, "")) > 0 &&
                      expenseParticipants.length > 0 && (
                        <View style={s.splitPreviewCard}>
                          <Ionicons name="calculator-outline" size={18} color={C.pinkDark} />
                          <Text style={s.splitPreviewText}>
                            หาร {expenseParticipants.length} คน ตกคนละ{" "}
                            <Text style={s.splitPreviewHighlight}>
                              ฿
                              {(
                                Number(expenseAmount.replace(/,/g, "")) /
                                expenseParticipants.length
                              ).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </Text>
                          </Text>
                        </View>
                      )}
                  </View>
                </>
              )}

              {/* ITEMIZED FOOD SPLIT MODE */}
              {splitMode === "itemized" && (
                <View style={{ marginBottom: 14 }}>
                  {/* FOOD MODE BANNER */}
                  <View style={s.itemizedBanner}>
                    <Ionicons name="sparkles" size={16} color="#D97706" />
                    <Text style={s.itemizedBannerText}>
                      ใส่แต่ละเมนูที่สั่ง และเลือกเฉพาะเพื่อนที่กินเมนูนั้นๆ เพื่อนที่ไม่กินจะไม่ต้องร่วมจ่ายเมนูนี้ครับ
                    </Text>
                  </View>

                  {/* LIST OF DISHES */}
                  {expenseItems.map((item, idx) => {
                    const itPrice = Number(String(item.amount).replace(/,/g, "")) || 0;
                    const itShare = itPrice / Math.max(item.participants.length, 1);
                    const allSelected = item.participants.length === members.length;

                    return (
                      <View key={item.id} style={s.subItemCard}>
                        <View style={s.subItemCardHeader}>
                          <View style={s.subItemNumBadge}>
                            <Text style={s.subItemNumBadgeText}>เมนูที่ {idx + 1}</Text>
                          </View>
                          {expenseItems.length > 1 && (
                            <TouchableOpacity
                              onPress={() => removeExpenseSubItem(item.id)}
                              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                              <Ionicons name="trash-outline" size={16} color="#DC2626" />
                            </TouchableOpacity>
                          )}
                        </View>

                        <View style={s.subItemInputRow}>
                          <View style={{ flex: 1.6, marginRight: 8 }}>
                            <TextInput
                              style={s.subItemInput}
                              placeholder="ชื่อเมนู เช่น ต้มยำกุ้ง, เบียร์"
                              placeholderTextColor={C.muted}
                              value={item.name}
                              onChangeText={(val) => updateExpenseSubItem(item.id, "name", val)}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <TextInput
                              style={s.subItemInput}
                              placeholder="ราคา (บาท)"
                              placeholderTextColor={C.muted}
                              keyboardType="decimal-pad"
                              value={item.amount}
                              onChangeText={(val) => updateExpenseSubItem(item.id, "amount", val)}
                            />
                          </View>
                        </View>

                        {/* DISH PARTICIPANTS SELECTOR */}
                        <View style={s.subItemParticipantsWrap}>
                          <View style={s.subItemParticipantsHeader}>
                            <Text style={s.subItemParticipantsLabel}>ใครกินเมนูนี้บ้าง?</Text>
                            <TouchableOpacity onPress={() => toggleSubItemSelectAll(item.id)}>
                              <Text style={s.subItemSelectAllBtn}>
                                {allSelected ? "ยกเลิกทุกคน" : "เลือกทุกคน"}
                              </Text>
                            </TouchableOpacity>
                          </View>

                          <View style={s.subItemChipsGrid}>
                            {members.map((m) => {
                              const isChecked = item.participants.includes(m.user_id);
                              const mName = getMemberName(m.user_id);
                              return (
                                <TouchableOpacity
                                  key={m.user_id}
                                  style={[
                                    s.subItemChip,
                                    isChecked && s.subItemChipActive,
                                  ]}
                                  activeOpacity={0.75}
                                  onPress={() => toggleSubItemParticipant(item.id, m.user_id)}
                                >
                                  <Ionicons
                                    name={isChecked ? "checkmark-circle" : "ellipse-outline"}
                                    size={13}
                                    color={isChecked ? C.white : C.muted}
                                    style={{ marginRight: 4 }}
                                  />
                                  <Text
                                    style={[
                                      s.subItemChipText,
                                      isChecked && s.subItemChipTextActive,
                                    ]}
                                    numberOfLines={1}
                                  >
                                    {mName}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>

                          {itPrice > 0 && item.participants.length > 0 && (
                            <View style={s.subItemSharePreview}>
                              <Ionicons name="people-outline" size={12} color={C.blue} />
                              <Text style={s.subItemSharePreviewText}>
                                หาร {item.participants.length} คน (คนละ ฿{itShare.toFixed(2)})
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}

                  {/* ADD MORE DISH BUTTON */}
                  <TouchableOpacity
                    style={s.addSubItemBtn}
                    activeOpacity={0.8}
                    onPress={addExpenseSubItem}
                  >
                    <Ionicons name="add-circle-outline" size={18} color={C.pinkDark} />
                    <Text style={s.addSubItemBtnText}>+ เพิ่มเมนูอาหาร / รายการย่อย</Text>
                  </TouchableOpacity>

                  {/* ITEMIZED TOTAL & BREAKDOWN PREVIEW */}
                  <View style={s.itemizedTotalCard}>
                    <View style={s.itemizedTotalRow}>
                      <Text style={s.itemizedTotalLabel}>ยอดรวมอาหารทั้งหมด:</Text>
                      <Text style={s.itemizedTotalValue}>
                        ฿{expenseItems.reduce(
                          (sum, it) => sum + (Number(String(it.amount).replace(/,/g, "")) || 0),
                          0
                        ).toLocaleString()}
                      </Text>
                    </View>

                    <View style={s.itemizedDivider} />

                    <Text style={s.itemizedBreakdownTitle}>🍽️ ยอดที่แต่ละคนต้องจ่ายตามจริง:</Text>
                    {members.map((m) => {
                      let mShare = 0;
                      let eatenCount = 0;
                      expenseItems.forEach((it) => {
                        const p = Number(String(it.amount).replace(/,/g, "")) || 0;
                        if (p > 0 && it.participants.includes(m.user_id)) {
                          mShare += p / Math.max(it.participants.length, 1);
                          eatenCount++;
                        }
                      });
                      const mName = getMemberName(m.user_id);
                      return (
                        <View key={m.user_id} style={s.itemizedMemberShareRow}>
                          <Text style={s.itemizedMemberShareName}>
                            {mName} <Text style={{ color: C.muted, fontSize: 11 }}>({eatenCount} เมนู)</Text>
                          </Text>
                          <Text style={s.itemizedMemberShareAmt}>
                            ฿{Math.round(mShare * 100) / 100}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* PAYER SELECTION */}
              <View style={{ marginTop: 6, marginBottom: 14 }}>
                <Text style={s.modalFieldTitle}>ใครเป็นคนออกเงินทั้งบิลไปก่อน?</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: 6 }}
                >
                  {members.map((m) => {
                    const isSelected = (expensePayer || userId) === m.user_id;
                    const mName = getMemberName(m.user_id);
                    return (
                      <TouchableOpacity
                        key={m.user_id}
                        onPress={() => setExpensePayer(m.user_id)}
                        style={[
                          s.payerChip,
                          isSelected && s.payerChipActive,
                        ]}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={isSelected ? "checkmark-circle" : "person-outline"}
                          size={15}
                          color={isSelected ? C.white : C.textMuted}
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={[
                            s.payerChipText,
                            isSelected && s.payerChipTextActive,
                          ]}
                        >
                          {mName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <Button
                title={busy ? "กำลังบันทึก..." : "บันทึกค่าใช้จ่าย"}
                onPress={saveExpense}
                disabled={busy}
              />

              <Button
                title="ยกเลิก"
                outline
                onPress={() => {
                  setExpenseModal(false);
                  setExpenseTitle("");
                  setExpenseAmount("");
                  setExpenseItems([]);
                }}
                style={{ marginTop: 10 }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* VIEW QR MODAL */}
      <Modal
        visible={!!viewingQrModal}
        transparent
        animationType="fade"
        onRequestClose={() => setViewingQrModal(null)}
      >
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { alignItems: "center" }]}>
            <Text style={s.modalTitle}>QR Code สแกนจ่ายเงิน</Text>
            <Text style={s.modalSubtitle}>
              {viewingQrModal?.name ? `โอนให้ ${viewingQrModal.name}` : "สแกนเพื่อโอนเงิน"}
            </Text>

            {viewingQrModal?.amount > 0 && (
              <View style={s.modalAmountBanner}>
                <Text style={s.modalAmountLabel}>ยอดที่ต้องโอน</Text>
                <Text style={s.modalAmountVal}>
                  ฿{Number(viewingQrModal.amount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            )}

            <View style={s.qrDisplayCard}>
              {viewingQrModal?.qrUri ? (
                <Image
                  source={{ uri: viewingQrModal.qrUri }}
                  style={s.qrLargeImage}
                  resizeMode="contain"
                />
              ) : viewingQrModal?.promptpay ? (
                <Image
                  source={{
                    uri: `https://promptpay.io/${viewingQrModal.promptpay.replace(/[^0-9]/g, "")}${viewingQrModal?.amount > 0 ? `/${viewingQrModal.amount}` : ""}.png`,
                  }}
                  style={s.qrLargeImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={s.noQrInsideModal}>
                  <Ionicons name="qr-code-outline" size={54} color={C.muted} />
                  <Text style={s.noQrInsideModalText}>
                    {viewingQrModal?.name} ยังไม่ได้ลงทะเบียน QR Code
                  </Text>
                  <TouchableOpacity
                    style={s.modalSetupQrBtn}
                    onPress={() => {
                      const target = { ...viewingQrModal };
                      setViewingQrModal(null);
                      openQrSetupModal(target.userId, target.name);
                    }}
                  >
                    <Text style={s.modalSetupQrBtnText}>
                      + ตั้งค่า QR Code / เบอร์พร้อมเพย์
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {(!!viewingQrModal?.promptpay || !!viewingQrModal?.bankName) && (
              <View style={s.qrMetaCard}>
                {!!viewingQrModal?.promptpay && (
                  <View style={s.qrMetaRow}>
                    <Text style={s.qrMetaLabel}>เบอร์พร้อมเพย์:</Text>
                    <Text style={s.qrMetaValue}>{viewingQrModal.promptpay}</Text>
                    <TouchableOpacity
                      style={s.copyMiniBtn}
                      onPress={() => {
                        Alert.alert("คัดลอกแล้ว", `คัดลอก ${viewingQrModal.promptpay} เรียบร้อยแล้ว`);
                      }}
                    >
                      <Ionicons name="copy-outline" size={14} color={C.pinkDark} />
                    </TouchableOpacity>
                  </View>
                )}
                {!!viewingQrModal?.bankName && (
                  <View style={s.qrMetaRow}>
                    <Text style={s.qrMetaLabel}>ธนาคาร:</Text>
                    <Text style={s.qrMetaValue}>
                      {viewingQrModal.bankName} {viewingQrModal.accountName ? `(${viewingQrModal.accountName})` : ""}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <Text style={s.qrScanTipText}>
              💡 เปิดแอปธนาคารใดก็ได้เพื่อสแกน QR Code หรือแคปหน้าจอเพื่อเปิดสแกนในแอปธนาคาร
            </Text>

            <View style={{ width: "100%", flexDirection: "row", marginTop: 14 }}>
              <TouchableOpacity
                style={[s.modalBtnSecondary, { flex: 1, marginRight: 8 }]}
                onPress={() => {
                  const target = { ...viewingQrModal };
                  setViewingQrModal(null);
                  openQrSetupModal(target.userId, target.name);
                }}
              >
                <Ionicons name="create-outline" size={14} color={C.pinkDark} />
                <Text style={s.modalBtnSecondaryText}>แก้ไขข้อมูล</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.modalBtnPrimary, { flex: 1, marginLeft: 8 }]}
                onPress={() => setViewingQrModal(null)}
              >
                <Text style={s.modalBtnPrimaryText}>ปิด</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* QR SETUP MODAL */}
      <Modal
        visible={qrSetupModal}
        transparent
        animationType="fade"
        onRequestClose={() => setQrSetupModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={s.modalOverlay}
        >
          <View style={[s.modalCard, { maxHeight: "90%" }]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 10 }}
            >
              <Text style={s.modalTitle}>ตั้งค่า QR Code รับเงิน</Text>
              <Text style={s.modalSubtitle}>
                {qrSetupTarget?.name ? `สำหรับ ${qrSetupTarget.name}` : "สำหรับบัญชีรับเงินของคุณ"}
              </Text>

              {/* IMAGE PICKER SECTION */}
              <Text style={s.modalFieldTitle}>รูปภาพ QR Code (ธนาคาร / พร้อมเพย์)</Text>
              {qrImageUri || qrImageBase64 ? (
                <View style={s.qrImagePickedBox}>
                  <Image
                    source={{ uri: qrImageUri || qrImageBase64 }}
                    style={s.qrImagePickedPreview}
                    resizeMode="contain"
                  />
                  <View style={s.qrImagePickedActions}>
                    <TouchableOpacity
                      style={s.qrImagePickAgainBtn}
                      onPress={pickQrImage}
                    >
                      <Ionicons name="camera-reverse-outline" size={14} color={C.pinkDark} />
                      <Text style={s.qrImagePickAgainText}>เปลี่ยนรูป</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[s.qrImagePickAgainBtn, { borderColor: "#FCA5A5" }]}
                      onPress={() => {
                        setQrImageUri("");
                        setQrImageBase64("");
                      }}
                    >
                      <Ionicons name="trash-outline" size={14} color="#DC2626" />
                      <Text style={[s.qrImagePickAgainText, { color: "#DC2626" }]}>ลบรูป</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={s.qrUploadDashedBox}
                  activeOpacity={0.8}
                  onPress={pickQrImage}
                >
                  <View style={s.qrUploadDashedInner}>
                    <Ionicons name="image-outline" size={28} color={C.pinkDark} />
                    <Text style={s.qrUploadDashedTitle}>+ แตะเพื่อเลือกรูป QR Code จากเครื่อง</Text>
                    <Text style={s.qrUploadDashedDesc}>รองรับรูป QR จากแอปธนาคารทุกธนาคาร</Text>
                  </View>
                </TouchableOpacity>
              )}

              <Input
                label="เบอร์พร้อมเพย์ หรือ เลขบัญชีธนาคาร"
                placeholder="เช่น 0812345678 หรือ 1234567890"
                value={qrInputPromptPay}
                onChangeText={setQrInputPromptPay}
                keyboardType="phone-pad"
                icon="phone-portrait-outline"
              />

              <Input
                label="ชื่อธนาคาร (ระบุหรือไม่ก็ได้)"
                placeholder="เช่น กสิกรไทย, ไทยพาณิชย์, กรุงไทย"
                value={qrInputBankName}
                onChangeText={setQrInputBankName}
                icon="business-outline"
              />

              <Input
                label="ชื่อเจ้าของบัญชี (ระบุหรือไม่ก็ได้)"
                placeholder="เช่น นายสมชาย ใจดี"
                value={qrInputAccountName}
                onChangeText={setQrInputAccountName}
                icon="person-outline"
              />

              <Button
                title={busy ? "กำลังบันทึก..." : "บันทึกข้อมูล QR Code"}
                onPress={saveQrData}
                disabled={busy}
              />

              <Button
                title="ยกเลิก"
                outline
                onPress={() => setQrSetupModal(false)}
                style={{ marginTop: 10 }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );

  // ========================================
  // 23. LOADING
  // ========================================

  if (!fontsLoaded || checkingSession) {
    return (
      <View style={s.loadingScreen}>
        <ActivityIndicator
          size="large"
          color={C.pink}
        />

        <Text style={s.loadingText}>
          กำลังโหลด TripBuddies...
        </Text>
      </View>
    );
  }

  // ========================================
  // 24. LANDING
  // ========================================

  if (screen === "landing") {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" />

        <View style={s.landing}>
          <View style={s.landingTop}>
            <View style={s.landingHeaderWrap}>
              <View style={s.luxuryBadge}>
                <Ionicons name="sparkles" size={11} color={C.pinkDark} />
                <Text style={s.luxuryBadgeText}>SMART TRIP PLANNER</Text>
              </View>
              <Brand />
            </View>

            <View style={s.landingMascotContainer}>
              <View style={s.mascotAura} />
              <Duck style={s.landingDuck} />
            </View>
          </View>

          <View style={s.landingPanel}>
            <View style={s.handle} />

            <Text style={s.landingTitle}>
              ทุกการเดินทาง{"\n"}
              พิเศษกว่าเมื่อมีเพื่อน
            </Text>

            <Text style={s.landingDesc}>
              วางแผนทริป จัดการงบ แชร์ค่าใช้จ่ายอย่างโปร่งใส{"\n"}
              และเก็บทุกความทรงจำไปด้วยกัน
            </Text>

            <View style={s.featurePillRow}>
              <View style={s.featurePill}>
                <Ionicons name="map-outline" size={13} color={C.pink} />
                <Text style={s.featurePillText}>วางแผนทริป</Text>
              </View>
              <View style={s.featurePill}>
                <Ionicons name="wallet-outline" size={13} color={C.green} />
                <Text style={s.featurePillText}>แชร์ค่าใช้จ่าย</Text>
              </View>
              <View style={s.featurePill}>
                <Ionicons name="people-outline" size={13} color={C.blue} />
                <Text style={s.featurePillText}>เที่ยวเป็นแก๊ง</Text>
              </View>
            </View>

            <Button
              title="เริ่มต้นใช้งาน"
              icon="arrow-forward"
              onPress={() => setScreen("welcome")}
              style={s.landingButton}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ========================================
  // 25. LOGIN
  // ========================================

  if (screen === "welcome") {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
        >
          <ScrollView
            contentContainerStyle={s.loginContent}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
          >
            <BackHeader onPress={goBack} />

            <View style={s.loginMascot}>
              <View style={s.loginMascotRing}>
                <Duck style={s.loginDuck} />
              </View>
            </View>

            <View style={s.loginHeading}>
              <Text style={s.pageTitle}>
                ยินดีต้อนรับกลับมา
              </Text>

              <Text style={s.subtitle}>
                เข้าสู่ระบบเพื่อวางแผนทริปและจัดการค่าใช้จ่าย
              </Text>
            </View>

            <View style={s.formCard}>
              <Input
                label="อีเมล"
                placeholder="example@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                icon="mail-outline"
              />

              <Input
                label="รหัสผ่าน"
                placeholder="กรอกรหัสผ่านของคุณ"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                icon="lock-closed-outline"
              />

              <TouchableOpacity
                style={s.forgot}
                onPress={async () => {
                  if (!email.trim()) {
                    Alert.alert(
                      "ลืมรหัสผ่าน",
                      "กรุณากรอกอีเมลก่อน"
                    );
                    return;
                  }

                  const { error } =
                    await supabase.auth.resetPasswordForEmail(
                      email.trim()
                    );

                  if (error) {
                    Alert.alert(
                      "ส่งอีเมลไม่สำเร็จ",
                      error.message
                    );
                  } else {
                    Alert.alert(
                      "ส่งอีเมลแล้ว",
                      "กรุณาตรวจสอบอีเมลเพื่อรีเซ็ตรหัสผ่าน"
                    );
                  }
                }}
              >
                <Text style={s.link}>
                  ลืมรหัสผ่าน?
                </Text>
              </TouchableOpacity>

              <Button
                title={
                  busy
                    ? "กำลังเข้าสู่ระบบ..."
                    : "เข้าสู่ระบบ"
                }
                icon="log-in-outline"
                onPress={login}
                disabled={busy}
              />
            </View>

            <View style={s.switchRow}>
              <Text style={s.muted}>
                ยังไม่มีบัญชี?{" "}
              </Text>

              <Text
                style={s.link}
                onPress={() => setScreen("register")}
              >
                สมัครสมาชิก
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ========================================
  // 26. REGISTER
  // ========================================

  if (screen === "register") {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
        >
          <ScrollView
            contentContainerStyle={s.registerContent}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
          >
            <BackHeader onPress={goBack} />

            <Text style={s.setupTitle}>
              กรอกโปรไฟล์ของคุณ
            </Text>

            <Text style={s.setupSubtitle}>
              มาเริ่มต้นการเดินทางไปด้วยกัน!
            </Text>

            <View style={s.setupAvatarWrap}>
              <View style={s.setupAvatarCircle}>
                <Duck style={s.setupDuck} />
              </View>
            </View>

            <View style={s.setupFormCard}>
              <Input
                label="ชื่อ - นามสกุล"
                placeholder="กรอกชื่อและนามสกุลของคุณ"
                value={name}
                onChangeText={setName}
                icon="person-outline"
              />

              <Input
                label="เบอร์โทรศัพท์"
                placeholder="0812345678"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                icon="call-outline"
              />

              <Text style={s.label}>สกุลเงินที่ต้องการใช้งาน</Text>

              <TouchableOpacity
                style={s.currencySelect}
                activeOpacity={0.8}
                onPress={() =>
                  setCurrency(
                    currency === "บาท (THB)"
                      ? "ดอลลาร์ (USD)"
                      : "บาท (THB)"
                  )
                }
              >
                <Ionicons name="globe-outline" size={18} color={C.pink} style={{ marginRight: 10 }} />
                <Text style={s.currencyText}>
                  {currency}
                </Text>
                <Ionicons name="chevron-down" size={18} color={C.muted} />
              </TouchableOpacity>

              <Input
                label="อีเมล"
                placeholder="example@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                icon="mail-outline"
              />

              <Input
                label="รหัสผ่าน"
                placeholder="อย่างน้อย 6 ตัวอักษร"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                icon="lock-closed-outline"
              />

              <Input
                label="ยืนยันรหัสผ่าน"
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                icon="shield-checkmark-outline"
              />
            </View>

            <Button
              title={
                busy
                  ? "กำลังสมัครสมาชิก..."
                  : "สมัครสมาชิก"
              }
              onPress={register}
              disabled={busy}
              style={{ marginTop: 15 }}
            />

            <View style={s.switchRow}>
              <Text style={s.muted}>
                มีบัญชีอยู่แล้ว?{" "}
              </Text>

              <Text
                style={s.link}
                onPress={() => setScreen("welcome")}
              >
                เข้าสู่ระบบ
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ========================================
  // 27. GROUPS SCREEN
  // ========================================

  if (screen === "groups") {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" />

        <View style={s.appScreen}>
          <ScrollView
            contentContainerStyle={s.homeContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={s.profileTitle}>
              กลุ่มของฉัน
            </Text>

            <Text style={s.subtitle}>
              สร้างกลุ่มหรือเข้าร่วมกลุ่มกับเพื่อน
            </Text>

            {/* CREATE GROUP */}

            <View style={s.groupActionCard}>
              <Text style={s.groupCardTitle}>
                สร้างกลุ่มใหม่
              </Text>

              <Text style={s.groupCardDesc}>
                สร้างพื้นที่สำหรับวางแผนทริปร่วมกัน
              </Text>

              <Button
                title="+ สร้างกลุ่ม"
                onPress={() => {
                  setGroupName("");
                  setGroupModal(true);
                }}
              />
            </View>

            {/* JOIN GROUP */}

            <View style={s.groupActionCard}>
              <Text style={s.groupCardTitle}>
                เข้าร่วมกลุ่ม
              </Text>

              <Input
                label="รหัสเชิญ"
                placeholder="กรอกรหัสเชิญจากเพื่อน"
                value={joinCode}
                onChangeText={setJoinCode}
              />

              <Button
                title={
                  groupActionBusy
                    ? "กำลังดำเนินการ..."
                    : "เข้าร่วมกลุ่ม"
                }
                outline
                onPress={joinGroup}
                disabled={groupActionBusy}
              />
            </View>

            {/* GROUP LIST */}

            <Text style={s.sectionTitle}>
              กลุ่มที่คุณเป็นสมาชิก
            </Text>

            {groups.length === 0 ? (
              <View style={s.emptyTrip}>
                <View style={s.emptyIconCircle}>
                  <Ionicons name="people-outline" size={26} color={C.muted} />
                </View>

                <Text style={s.emptyTripTitle}>
                  ยังไม่มีกลุ่ม
                </Text>

                <Text style={s.emptyTripText}>
                  สร้างกลุ่มแรกของคุณ หรือเข้าร่วมด้วยรหัสเชิญจากเพื่อน
                </Text>
              </View>
            ) : (
              groups.map((group) => {
                const isActive = activeGroup?.id === group.id;
                return (
                  <TouchableOpacity
                    key={group.id}
                    style={[
                      s.groupItem,
                      isActive && s.groupItemActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => selectGroup(group)}
                  >
                    <View
                      style={[
                        s.groupIcon,
                        isActive && { backgroundColor: C.pinkLight },
                      ]}
                    >
                      <Ionicons
                        name="people"
                        size={20}
                        color={isActive ? C.pinkDark : C.textMuted}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={s.groupItemName}>
                        {group.name}
                      </Text>

                      <Text style={s.groupItemRole}>
                        {group.role === "owner"
                          ? "เจ้าของกลุ่ม 👑"
                          : group.role === "admin"
                          ? "แอดมิน"
                          : "สมาชิก"}
                      </Text>
                    </View>

                    <Ionicons
                      name={isActive ? "checkmark-circle" : "chevron-forward"}
                      size={20}
                      color={isActive ? C.green : C.muted}
                    />
                  </TouchableOpacity>
                );
              })
            )}

            {/* ACTIVE GROUP DETAIL */}

            {activeGroup && (
              <View style={s.groupActionCard}>
                <View style={s.groupDetailHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.groupCardTitle}>
                      {activeGroup.name}
                    </Text>
                    <Text style={s.groupCardDesc}>
                      กลุ่มที่กำลังใช้งานในปัจจุบัน
                    </Text>
                  </View>
                  <View style={s.groupStatusTag}>
                    <Text style={s.groupStatusTagText}>กลุ่มปัจจุบัน</Text>
                  </View>
                </View>

                {/* INVITE CODE BOX */}
                <View style={s.inviteCodeBox}>
                  <View>
                    <Text style={s.inviteCodeLabel}>รหัสเชิญเพื่อนเข้าร่วม</Text>
                    <Text style={s.inviteCodeValue}>
                      {activeGroup.invite_code}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={s.copyButton}
                    activeOpacity={0.8}
                    onPress={() =>
                      Alert.alert(
                        "รหัสเชิญกลุ่ม",
                        `รหัสเชิญของคุณคือ: ${activeGroup.invite_code}\n\nส่งรหัสนี้ให้เพื่อนเพื่อเข้าร่วมกลุ่มได้เลย!`
                      )
                    }
                  >
                    <Ionicons name="copy-outline" size={14} color={C.pinkDark} />
                    <Text style={s.copyButtonText}>คัดลอก</Text>
                  </TouchableOpacity>
                </View>

                <View style={s.divider} />

                <View style={s.memberHeaderRow}>
                  <Text style={s.groupCardTitle}>
                    สมาชิกในกลุ่ม
                  </Text>
                  <View style={s.memberCountBadge}>
                    <Text style={s.memberCountBadgeText}>
                      {members.length} คน
                    </Text>
                  </View>
                </View>

                {members.map((member) => {
                  const isMe = member.user_id === userId;
                  const memberDisplayName = isMe
                    ? (name ? `${name} (ฉัน)` : "ฉัน")
                    : getMemberName(member.user_id);

                  return (
                    <View key={member.user_id} style={s.memberRow}>
                      <View style={s.memberAvatar}>
                        <Ionicons name="person" size={16} color={C.pinkDark} />
                      </View>

                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={s.memberName}>{memberDisplayName}</Text>
                        <Text style={s.memberRoleSub}>
                          {member.role === "owner"
                            ? "เจ้าของกลุ่ม 👑"
                            : member.role === "admin"
                            ? "แอดมิน"
                            : "สมาชิก"}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={s.editNickBtn}
                        activeOpacity={0.7}
                        onPress={() => {
                          setEditingMember(member);
                          setEditingNickInput(
                            memberDisplayName
                              .replace(" (ฉัน)", "")
                              .replace(" (ตัวคุณ)", "")
                          );
                        }}
                      >
                        <Ionicons name="pencil-sharp" size={11} color={C.pinkDark} />
                        <Text style={s.editNickBtnText}>แก้ไขชื่อ</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}

                {(activeGroup.role === "owner" ||
                  activeGroup.role === "admin") && (
                  <>
                    <View style={s.divider} />

                    <Text style={s.groupCardTitle}>
                      เพิ่มสมาชิกด้วยอีเมล
                    </Text>

                    <Text style={s.groupCardDesc}>
                      เพื่อนต้องสมัครบัญชี TripBuddies ก่อน
                    </Text>

                    <Input
                      placeholder="อีเมลของเพื่อน"
                      value={memberEmail}
                      onChangeText={setMemberEmail}
                      keyboardType="email-address"
                    />

                    <Button
                      title="เพิ่มสมาชิก"
                      onPress={addMember}
                      disabled={groupActionBusy}
                    />
                  </>
                )}

                <View style={s.divider} />

                {trips.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <View style={s.memberHeaderRow}>
                      <Text style={s.groupCardTitle}>
                        ทริปในกลุ่มนี้
                      </Text>
                      <View style={s.memberCountBadge}>
                        <Text style={s.memberCountBadgeText}>
                          {trips.length} ทริป
                        </Text>
                      </View>
                    </View>

                    {trips.map((trip) => (
                      <TouchableOpacity
                        key={trip.id}
                        style={s.otherTripCard}
                        activeOpacity={0.8}
                        onPress={() => openTripDetail(trip)}
                      >
                        <View style={s.otherTripIcon}>
                          <Ionicons name="airplane-outline" size={18} color={C.pinkDark} />
                        </View>
                        <View style={{ flex: 1, paddingHorizontal: 10 }}>
                          <Text style={s.otherTripTitle} numberOfLines={1}>
                            {trip.title}
                          </Text>
                          <Text style={s.otherTripSub} numberOfLines={1}>
                            {trip.destination || "ไม่ระบุสถานที่"}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={C.muted} />
                      </TouchableOpacity>
                    ))}
                    <View style={[s.divider, { marginTop: 12 }]} />
                  </View>
                )}

                <Button
                  title="สร้างทริปในกลุ่มนี้"
                  onPress={() => {
                    setTab("home");
                    setScreen("home");
                    createTrip();
                  }}
                />
              </View>
            )}
          </ScrollView>

          {bottomNav()}

          {/* CREATE GROUP MODAL */}

          <Modal
            visible={groupModal}
            transparent
            animationType="fade"
            onRequestClose={() => setGroupModal(false)}
          >
            <View style={s.modalOverlay}>
              <View style={s.modalCard}>
                <Text style={s.modalTitle}>
                  สร้างกลุ่มใหม่
                </Text>

                <Text style={s.modalSubtitle}>
                  ตั้งชื่อกลุ่มสำหรับคุณและเพื่อน
                </Text>

                <Input
                  label="ชื่อกลุ่ม"
                  placeholder="เช่น แก๊งเที่ยวเชียงใหม่"
                  value={groupName}
                  onChangeText={setGroupName}
                  icon="people-outline"
                />

                <Button
                  title={
                    groupActionBusy
                      ? "กำลังสร้างกลุ่ม..."
                      : "สร้างกลุ่ม"
                  }
                  onPress={createGroup}
                  disabled={groupActionBusy}
                />

                <Button
                  title="ยกเลิก"
                  outline
                  onPress={() => setGroupModal(false)}
                  style={{ marginTop: 10 }}
                />
              </View>
            </View>
          </Modal>

          {/* EDIT MEMBER NICKNAME MODAL */}
          <Modal
            visible={!!editingMember}
            transparent
            animationType="fade"
            onRequestClose={() => setEditingMember(null)}
          >
            <View style={s.modalOverlay}>
              <View style={s.modalCard}>
                <Text style={s.modalTitle}>แก้ไขชื่อสมาชิกในกลุ่ม</Text>
                <Text style={s.modalSubtitle}>
                  ตั้งชื่อเรียกที่คุ้นเคย เพื่อแสดงในรายการรายจ่ายและสรุปยอดโอน
                </Text>

                <Input
                  label="ชื่อเรียก / ชื่อเล่น"
                  placeholder="เช่น สมชาย, พี่กอล์ฟ, แอน"
                  value={editingNickInput}
                  onChangeText={setEditingNickInput}
                  icon="person-outline"
                />

                <Button
                  title="บันทึกชื่อ"
                  onPress={() => {
                    if (editingMember) {
                      if (editingMember.user_id === userId) {
                        setName(editingNickInput.trim());
                      }
                      saveMemberNickname(editingMember.user_id, editingNickInput);
                    }
                  }}
                />

                <Button
                  title="ยกเลิก"
                  outline
                  onPress={() => {
                    setEditingMember(null);
                    setEditingNickInput("");
                  }}
                  style={{ marginTop: 10 }}
                />
              </View>
            </View>
          </Modal>
        </View>
      </SafeAreaView>
    );
  }

  // ========================================
  // 28. HOME DASHBOARD
  // ========================================

  if (screen === "home") {
    const latestTrip = trips[0];

    const remaining = Math.max(
      totalBudget - totalSpent,
      0
    );

    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" />

        <View style={s.appScreen}>
          <ScrollView
            contentContainerStyle={s.homeContent}
            showsVerticalScrollIndicator={false}
          >
            {/* HEADER */}

            <View style={s.homeHeader}>
              <TouchableOpacity
                style={s.homeAvatar}
                onPress={() => nav("profile")}
                activeOpacity={0.8}
              >
                <Duck style={s.homeAvatarImage} />
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={0.7}
                onPress={() => nav("groups")}
              >
                <View style={s.homeNameRow}>
                  <Text style={s.homeName}>
                    {name || "Trip Explorer"}
                  </Text>
                  <Ionicons name="chevron-down" size={15} color={C.textMuted} style={{ marginLeft: 4 }} />
                </View>

                <Text style={s.homeGreeting}>
                  {getTimeGreeting()} • {activeGroup ? activeGroup.name : "เลือกกลุ่มเพื่อเริ่มทริป"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.notification}
                activeOpacity={0.8}
                onPress={() =>
                  Alert.alert(
                    "การแจ้งเตือน",
                    "ไม่มีการแจ้งเตือนใหม่ในขณะนี้"
                  )
                }
              >
                <Ionicons name="notifications-outline" size={20} color={C.text} />
                <View style={s.notificationDot} />
              </TouchableOpacity>
            </View>

            {/* PREMIER TRIP BANNER */}

            <View style={s.tripBanner}>
              <View style={s.bannerContent}>
                <View style={s.bannerTag}>
                  <Ionicons name="sparkles" size={11} color={C.white} />
                  <Text style={s.bannerTagText}>TRIP PLANNER</Text>
                </View>

                <Text style={s.bannerTitle}>
                  ออกเดินทางไปด้วยกัน
                </Text>

                <Text style={s.bannerSubtitle}>
                  {activeGroup
                    ? `กลุ่ม ${activeGroup.name} • ${trips.length} ทริป`
                    : "เริ่มต้นวางแผนการเดินทางและแชร์ค่าใช้จ่าย"}
                </Text>

                <TouchableOpacity
                  style={s.createButton}
                  activeOpacity={0.85}
                  onPress={() => {
                    if (activeGroup) {
                      createTrip();
                    } else {
                      nav("groups");
                    }
                  }}
                >
                  <Ionicons
                    name={activeGroup ? "add" : "people"}
                    size={15}
                    color={C.pinkDark}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={s.createButtonText}>
                    {activeGroup ? "สร้างทริปใหม่" : "สร้างกลุ่มแรก"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={s.bannerFlightBadge}>
                <Ionicons name="airplane" size={30} color="rgba(255,255,255,0.85)" />
              </View>
            </View>

            {/* ACTIVE GROUP SELECTOR */}

            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>
                กลุ่มที่กำลังใช้งาน
              </Text>

              <TouchableOpacity
                onPress={() => nav("groups")}
                activeOpacity={0.7}
              >
                <Text style={s.seeAll}>
                  สลับกลุ่ม ›
                </Text>
              </TouchableOpacity>
            </View>

            {activeGroup ? (
              <TouchableOpacity
                style={s.activeGroupCard}
                activeOpacity={0.8}
                onPress={() => nav("groups")}
              >
                <View style={s.groupIcon}>
                  <Ionicons name="people" size={20} color={C.pink} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={s.groupItemName}>
                    {activeGroup.name}
                  </Text>

                  <Text style={s.groupItemRole}>
                    {members.length} สมาชิก • รหัส {activeGroup.invite_code}
                  </Text>
                </View>

                <View style={s.activeGroupBadge}>
                  <Ionicons name="checkmark-circle" size={18} color={C.green} />
                </View>
              </TouchableOpacity>
            ) : (
              <View style={s.emptyTrip}>
                <View style={s.emptyIconCircle}>
                  <Ionicons name="people-outline" size={26} color={C.muted} />
                </View>

                <Text style={s.emptyTripTitle}>
                  ยังไม่ได้เลือกกลุ่ม
                </Text>

                <Text style={s.emptyTripText}>
                  สร้างกลุ่มหรือเข้าร่วมกลุ่มก่อนเพื่อเริ่มวางแผนทริป
                </Text>

                <Button
                  title="ไปหน้ากลุ่ม"
                  icon="arrow-forward"
                  onPress={() => nav("groups")}
                  style={{ width: "100%", marginTop: 14 }}
                />
              </View>
            )}

            {/* RECENT TRIP */}

            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>
                ทริปล่าสุดของกลุ่ม
              </Text>

              <TouchableOpacity
                onPress={() => nav("groups")}
                activeOpacity={0.7}
              >
                <Text style={s.seeAll}>
                  ดูกลุ่ม ›
                </Text>
              </TouchableOpacity>
            </View>

            {latestTrip ? (
              <TouchableOpacity
                style={s.tripCard}
                activeOpacity={0.85}
                onPress={() => openTripDetail(latestTrip)}
              >
                <View style={s.tripPhoto}>
                  <Ionicons name="compass" size={32} color={C.blue} />
                </View>

                <View style={s.tripInfo}>
                  <View style={s.tripTitleRow}>
                    <Text style={s.tripName} numberOfLines={1}>
                      {latestTrip.title}
                    </Text>
                    <View style={s.destinationBadge}>
                      <Ionicons name="location-sharp" size={11} color={C.pinkDark} />
                      <Text style={s.destinationText} numberOfLines={1}>
                        {latestTrip.destination || "ไม่ระบุ"}
                      </Text>
                    </View>
                  </View>

                  <View style={s.tripDetailHintRow}>
                    <Ionicons name="wallet-outline" size={13} color={C.pinkDark} />
                    <Text style={s.tripDetailHintText}>
                      แตะเพื่อจัดการค่าใช้จ่าย & สรุปยอดเคลียร์เงิน
                    </Text>
                    <Ionicons name="chevron-forward" size={14} color={C.pinkDark} />
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={s.emptyTrip}>
                <View style={s.emptyIconCircle}>
                  <Ionicons name="briefcase-outline" size={26} color={C.muted} />
                </View>

                <Text style={s.emptyTripTitle}>
                  ยังไม่มีทริปในกลุ่มนี้
                </Text>

                <Text style={s.emptyTripText}>
                  สร้างทริปแรกเพื่อเริ่มบันทึกและแชร์ค่าใช้จ่าย
                </Text>
              </View>
            )}

            {/* OTHER TRIPS IN GROUP */}
            {trips.length > 1 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={[s.sectionTitle, { marginBottom: 10 }]}>
                  ทริปอื่นๆ ในกลุ่ม ({trips.length - 1})
                </Text>
                {trips.slice(1).map((trip) => (
                  <TouchableOpacity
                    key={trip.id}
                    style={s.otherTripCard}
                    activeOpacity={0.8}
                    onPress={() => openTripDetail(trip)}
                  >
                    <View style={s.otherTripIcon}>
                      <Ionicons name="airplane-outline" size={18} color={C.pinkDark} />
                    </View>
                    <View style={{ flex: 1, paddingHorizontal: 10 }}>
                      <Text style={s.otherTripTitle} numberOfLines={1}>
                        {trip.title}
                      </Text>
                      <Text style={s.otherTripSub} numberOfLines={1}>
                        {trip.destination || "ไม่ระบุสถานที่"}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={C.muted} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* EXPENSES OVERVIEW CARD */}
            <View style={s.budgetCard}>
              <View style={s.budgetHeader}>
                <View style={s.budgetHeaderLeft}>
                  <Ionicons name="wallet-outline" size={16} color={C.pink} />
                  <Text style={s.budgetHeaderTitle}>ภาพรวมค่าใช้จ่ายในกลุ่ม</Text>
                </View>
                <View style={s.currencyPill}>
                  <Text style={s.currencyPillText}>THB ฿</Text>
                </View>
              </View>

              <View style={s.budgetHero}>
                <Text style={s.budgetHeroLabel}>ยอดจ่ายรวมทั้งหมด</Text>
                <Text style={s.budgetHeroValue}>
                  ฿{totalSpent.toLocaleString()}
                </Text>
              </View>

              <View style={[s.budgetChipsRow, { marginTop: 14 }]}>
                <View style={s.budgetChip}>
                  <View style={[s.budgetDot, { backgroundColor: C.pink }]} />
                  <View>
                    <Text style={s.budgetChipLabel}>ทริปทั้งหมด</Text>
                    <Text style={s.budgetChipValue}>
                      {trips.length} ทริป
                    </Text>
                  </View>
                </View>

                <View style={s.budgetChipDivider} />

                <View style={s.budgetChip}>
                  <View style={[s.budgetDot, { backgroundColor: C.blue }]} />
                  <View>
                    <Text style={s.budgetChipLabel}>สมาชิกในกลุ่ม</Text>
                    <Text style={s.budgetChipValue}>
                      {members.length} คน
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* QUICK MENU */}

            <Text style={s.sectionTitle}>
              เมนูด่วน
            </Text>

            <View style={s.quickRow}>
              <TouchableOpacity
                style={s.quickItem}
                activeOpacity={0.75}
                onPress={createTrip}
              >
                <View style={[s.quickIconBox, { backgroundColor: C.pinkLight }]}>
                  <Ionicons name="add-circle" size={22} color={C.pink} />
                </View>
                <Text style={s.quickLabel}>
                  เพิ่มทริป
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.quickItem}
                activeOpacity={0.75}
                onPress={() => nav("groups")}
              >
                <View style={[s.quickIconBox, { backgroundColor: C.blueLight }]}>
                  <Ionicons name="people" size={22} color={C.blue} />
                </View>
                <Text style={s.quickLabel}>
                  ดูสมาชิก
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.quickItem}
                activeOpacity={0.75}
                onPress={() => {
                  if (trips.length > 0) {
                    openTripDetail(trips[0]);
                  } else if (!activeGroup) {
                    Alert.alert(
                      "ยังไม่ได้เลือกกลุ่ม",
                      "กรุณาเลือกหรือสร้างกลุ่มก่อนบันทึกค่าใช้จ่าย",
                      [
                        { text: "ไปหน้ากลุ่ม", onPress: () => nav("groups") },
                        { text: "ยกเลิก", style: "cancel" },
                      ]
                    );
                  } else {
                    Alert.alert(
                      "ยังไม่มีทริป",
                      "กรุณาสร้างทริปแรกในกลุ่มก่อนบันทึกค่าใช้จ่าย",
                      [
                        { text: "+ สร้างทริป", onPress: createTrip },
                        { text: "ยกเลิก", style: "cancel" },
                      ]
                    );
                  }
                }}
              >
                <View style={[s.quickIconBox, { backgroundColor: C.orangeLight }]}>
                  <Ionicons name="wallet" size={22} color={C.orange} />
                </View>
                <Text style={s.quickLabel}>
                  บันทึกจ่าย
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.quickItem}
                activeOpacity={0.75}
                onPress={() => nav("profile")}
              >
                <View style={[s.quickIconBox, { backgroundColor: "#F3EFF1" }]}>
                  <Ionicons name="settings-sharp" size={20} color={C.textMuted} />
                </View>
                <Text style={s.quickLabel}>
                  ตั้งค่า
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {bottomNav()}

          {/* CREATE TRIP MODAL */}

          <Modal
            visible={tripModal}
            transparent
            animationType="fade"
            onRequestClose={() => setTripModal(false)}
          >
            <View style={s.modalOverlay}>
              <View style={s.modalCard}>
                <Text style={s.modalTitle}>
                  สร้างทริปใหม่
                </Text>

                <Text style={s.modalSubtitle}>
                  กลุ่ม: {activeGroup?.name || "-"}
                </Text>

                <Input
                  label="ชื่อทริป"
                  placeholder="เช่น เที่ยวเชียงใหม่"
                  value={tripTitle}
                  onChangeText={setTripTitle}
                  icon="map-outline"
                />

                <Input
                  label="สถานที่"
                  placeholder="เช่น เชียงใหม่"
                  value={tripDestination}
                  onChangeText={setTripDestination}
                  icon="location-outline"
                />

                <Button
                  title={
                    busy
                      ? "กำลังบันทึก..."
                      : "บันทึกทริป"
                  }
                  onPress={saveTrip}
                  disabled={busy}
                />

                <Button
                  title="ยกเลิก"
                  outline
                  onPress={() => setTripModal(false)}
                  style={{ marginTop: 10 }}
                />
              </View>
            </View>
          </Modal>
        </View>
      </SafeAreaView>
    );
  }

  // ========================================
  // 28.1 TRIP DETAIL & SETTLEMENT SCREEN
  // ========================================

  if (screen === "tripDetail") {
    const currentTrip =
      selectedTrip ||
      trips.find((t) => t.id === expenseTripId) ||
      trips[0];

    const tripSpent = tripExpenses.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );
    const tripBudgetNum = Number(currentTrip?.budget || 0);
    const tripRemain = Math.max(tripBudgetNum - tripSpent, 0);

    const settlement = calculateSettlement(tripExpenses, members);

    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" />

        <View style={s.appScreen}>
          {/* HEADER */}
          <View style={s.tripDetailHeader}>
            <TouchableOpacity
              onPress={() => {
                setTab("home");
                setScreen("home");
              }}
              style={s.backButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="chevron-back" size={20} color={C.text} />
            </TouchableOpacity>

            <View style={{ flex: 1, paddingHorizontal: 8 }}>
              <Text style={s.tripDetailHeaderTitle} numberOfLines={1}>
                {currentTrip?.title || "รายละเอียดทริป"}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                <Ionicons name="location-sharp" size={11} color={C.pinkDark} />
                <Text style={s.tripDetailHeaderSub} numberOfLines={1}>
                  {currentTrip?.destination || "ไม่ระบุสถานที่"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={s.tripDetailAddBtn}
              activeOpacity={0.82}
              onPress={() => openExpenseModal(currentTrip?.id)}
            >
              <Ionicons name="add" size={16} color={C.white} />
              <Text style={s.tripDetailAddBtnText}>เพิ่มจ่าย</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={s.tripDetailContent}
            showsVerticalScrollIndicator={false}
          >
            {/* TRIP FINANCIAL HERO CARD */}
            <View style={s.tripHeroCard}>
              <View style={s.tripHeroRow}>
                <View>
                  <Text style={s.tripHeroBudgetLabel}>ค่าใช้จ่ายทั้งหมดในทริป</Text>
                  <Text style={s.tripHeroSpentText}>
                    ฿{tripSpent.toLocaleString()}
                  </Text>
                </View>
                <View style={s.tripHeroBadge}>
                  <Ionicons name="receipt-outline" size={12} color={C.pinkDark} style={{ marginRight: 4 }} />
                  <Text style={s.tripHeroBadgeText}>
                    {tripExpenses.length} รายการ
                  </Text>
                </View>
              </View>

              <View style={[s.tripHeroStatsRow, { marginTop: 16 }]}>
                <View style={s.tripHeroStat}>
                  <Text style={s.tripHeroStatLabel}>รายการค่าใช้จ่าย</Text>
                  <Text style={s.tripHeroStatValue}>
                    {tripExpenses.length} รายการ
                  </Text>
                </View>

                <View style={s.tripHeroStatDivider} />

                <View style={s.tripHeroStat}>
                  <Text style={s.tripHeroStatLabel}>สมาชิกในกลุ่ม</Text>
                  <Text style={s.tripHeroStatValue}>
                    {members.length} คน
                  </Text>
                </View>

                <View style={s.tripHeroStatDivider} />

                <View style={s.tripHeroStat}>
                  <Text style={s.tripHeroStatLabel}>เฉลี่ยต่อคน</Text>
                  <Text style={[s.tripHeroStatValue, { color: C.pinkDark }]}>
                    ฿{Math.round(tripSpent / Math.max(members.length, 1)).toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>

            {/* SEGMENT TABS */}
            <View style={s.segmentTabsContainer}>
              <TouchableOpacity
                style={[
                  s.segmentTab,
                  detailTab === "expenses" && s.segmentTabActive,
                ]}
                activeOpacity={0.8}
                onPress={() => setDetailTab("expenses")}
              >
                <Ionicons
                  name="receipt-outline"
                  size={15}
                  color={detailTab === "expenses" ? C.pinkDark : C.textMuted}
                />
                <Text
                  style={[
                    s.segmentTabText,
                    detailTab === "expenses" && s.segmentTabTextActive,
                  ]}
                >
                  รายการจ่าย ({tripExpenses.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  s.segmentTab,
                  detailTab === "settlement" && s.segmentTabActive,
                ]}
                activeOpacity={0.8}
                onPress={() => setDetailTab("settlement")}
              >
                <Ionicons
                  name="swap-horizontal-outline"
                  size={15}
                  color={detailTab === "settlement" ? C.pinkDark : C.textMuted}
                />
                <Text
                  style={[
                    s.segmentTabText,
                    detailTab === "settlement" && s.segmentTabTextActive,
                  ]}
                >
                  สรุปเคลียร์เงิน ({settlement.transfers.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* TAB 1: EXPENSES LIST */}
            {detailTab === "expenses" && (
              <View style={s.tabSection}>
                {loadingExpenses ? (
                  <View style={{ padding: 40, alignItems: "center" }}>
                    <ActivityIndicator size="small" color={C.pink} />
                    <Text
                      style={{
                        marginTop: 10,
                        color: C.muted,
                        fontFamily: "Prompt_400Regular",
                        fontSize: 12,
                      }}
                    >
                      กำลังโหลดรายการค่าใช้จ่าย...
                    </Text>
                  </View>
                ) : tripExpenses.length === 0 ? (
                  <View style={s.emptyTrip}>
                    <View style={s.emptyIconCircle}>
                      <Ionicons name="receipt-outline" size={26} color={C.muted} />
                    </View>
                    <Text style={s.emptyTripTitle}>ยังไม่มีรายการค่าใช้จ่าย</Text>
                    <Text style={s.emptyTripText}>
                      กดปุ่ม "เพิ่มจ่าย" เพื่อบันทึกว่าใครออกเงินไปก่อน และใครต้องร่วมหารบ้าง
                    </Text>
                    <Button
                      title="+ เพิ่มรายการแรก"
                      icon="add"
                      style={{ marginTop: 14 }}
                      onPress={() => openExpenseModal(currentTrip?.id)}
                    />
                  </View>
                ) : (
                  tripExpenses.map((exp) => {
                    const payerName = getMemberName(exp.paid_by);
                    const isItemized =
                      exp.splitType === "itemized" &&
                      Array.isArray(exp.items) &&
                      exp.items.length > 0;
                    const pList =
                      exp.participants && exp.participants.length > 0
                        ? exp.participants
                        : members.map((m) => m.user_id);
                    const perPerson =
                      Math.round(
                        (Number(exp.amount) / Math.max(pList.length, 1)) * 100
                      ) / 100;
                    const isExpanded = !!expandedExpenses[exp.id];

                    return (
                      <View key={exp.id} style={s.expenseItemCard}>
                        <View style={s.expenseTopRow}>
                          <View style={s.expenseIconBox}>
                            <Ionicons
                              name={isItemized ? "restaurant-outline" : "wallet-outline"}
                              size={18}
                              color={isItemized ? "#D97706" : C.pinkDark}
                            />
                          </View>

                          <View style={{ flex: 1, paddingHorizontal: 10 }}>
                            <Text style={s.expenseItemTitle}>{exp.title}</Text>
                            <Text style={s.expenseDate}>
                              {new Date(exp.created_at).toLocaleDateString("th-TH", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </Text>
                          </View>

                          <View style={{ alignItems: "flex-end" }}>
                            <Text style={s.expenseItemAmount}>
                              ฿{Number(exp.amount).toLocaleString()}
                            </Text>
                            <TouchableOpacity
                              onPress={() => deleteExpense(exp.id, exp.title)}
                              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                              style={s.deleteExpenseBtn}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="trash-outline" size={13} color="#DC2626" />
                              <Text style={s.deleteExpenseBtnText}>ลบ</Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View style={s.expenseDivider} />

                        <View style={s.expenseMetaRow}>
                          <View style={s.expensePayerBadge}>
                            <Ionicons name="card-outline" size={13} color={C.green} />
                            <Text style={s.expensePayerText}>
                              จ่ายโดย: <Text style={{ fontFamily: "Prompt_600SemiBold" }}>{payerName}</Text>
                            </Text>
                          </View>

                          {isItemized ? (
                            <View style={s.expenseItemizedBadge}>
                              <Ionicons name="restaurant" size={12} color="#D97706" />
                              <Text style={s.expenseItemizedBadgeText}>
                                แยกตามเมนู ({exp.items.length} รายการ)
                              </Text>
                            </View>
                          ) : (
                            <View style={s.expenseShareBadge}>
                              <Ionicons name="people-outline" size={13} color={C.blue} />
                              <Text style={s.expenseShareText}>
                                หาร {pList.length} คน (คนละ ฿{perPerson.toLocaleString()})
                              </Text>
                            </View>
                          )}
                        </View>

                        <View style={s.expenseParticipantsWrap}>
                          <Text style={s.expenseParticipantsLabel}>ผู้ร่วมหาร: </Text>
                          <Text style={s.expenseParticipantsNames} numberOfLines={2}>
                            {pList.map((pId) => getMemberName(pId)).join(", ")}
                          </Text>
                        </View>

                        {/* ACCORDION FOR ITEMIZED FOOD DISHES */}
                        {isItemized && (
                          <View style={{ marginTop: 8 }}>
                            <TouchableOpacity
                              style={s.accordionToggleBtn}
                              activeOpacity={0.7}
                              onPress={() => toggleExpenseAccordion(exp.id)}
                            >
                              <Ionicons
                                name={isExpanded ? "chevron-up" : "chevron-down"}
                                size={14}
                                color={C.pinkDark}
                              />
                              <Text style={s.accordionToggleText}>
                                {isExpanded
                                  ? "ซ่อนรายการเมนูอาหาร"
                                  : `ดูเมนูอาหารและคนกิน (${exp.items.length} เมนู)`}
                              </Text>
                            </TouchableOpacity>

                            {isExpanded && (
                              <View style={s.subItemsAccordionCard}>
                                {exp.items.map((it, itIdx) => {
                                  const itPrice = Number(it.amount) || 0;
                                  const itParts = it.participants || [];
                                  const itShare =
                                    itPrice / Math.max(itParts.length, 1);
                                  return (
                                    <View
                                      key={it.id || itIdx}
                                      style={[
                                        s.subItemAccordionRow,
                                        itIdx === exp.items.length - 1 && { borderBottomWidth: 0 },
                                      ]}
                                    >
                                      <View style={{ flex: 1, paddingRight: 8 }}>
                                        <Text style={s.subItemAccordionName}>
                                          {itIdx + 1}. {it.name}
                                        </Text>
                                        <Text style={s.subItemAccordionEaters}>
                                          คนกิน:{" "}
                                          {itParts.length === 0
                                            ? "ไม่มีคนกิน"
                                            : itParts
                                                .map((pId) => getMemberName(pId))
                                                .join(", ")}
                                        </Text>
                                      </View>
                                      <View style={{ alignItems: "flex-end" }}>
                                        <Text style={s.subItemAccordionPrice}>
                                          ฿{itPrice.toLocaleString()}
                                        </Text>
                                        <Text style={s.subItemAccordionShare}>
                                          หาร {itParts.length} คน (ละ ฿{Math.round(itShare * 100) / 100})
                                        </Text>
                                      </View>
                                    </View>
                                  );
                                })}
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {/* TAB 2: SETTLEMENT & TRANSFERS */}
            {detailTab === "settlement" && (
              <View style={s.tabSection}>
                {/* ALGORITHM BANNER */}
                <View style={s.algoBanner}>
                  <View style={s.algoIconCircle}>
                    <Ionicons name="sparkles" size={16} color={C.pinkDark} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={s.algoBannerTitle}>
                      คำนวณแบบ Minimum Transfers
                    </Text>
                    <Text style={s.algoBannerDesc}>
                      ระบบหักลบหนี้สินแบบรวมศูนย์ เพื่อให้โอนเงินหากันน้อยครั้งที่สุด
                    </Text>
                  </View>
                </View>

                {/* TRANSFER TRANSACTIONS SUMMARY */}
                <View style={s.settlementCard}>
                  <View style={s.settlementCardHeader}>
                    <Text style={s.settlementCardTitle}>
                      สรุปรายการที่ต้องโอน ({settlement.transfers.length})
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <TouchableOpacity
                        style={[s.copySummaryBtn, { marginRight: 6, backgroundColor: C.pinkLight }]}
                        activeOpacity={0.8}
                        onPress={() => openQrSetupModal(userId, name || "ฉัน")}
                      >
                        <Ionicons name="qr-code-outline" size={13} color={C.pinkDark} />
                        <Text style={s.copySummaryBtnText}>QR ของฉัน</Text>
                      </TouchableOpacity>

                      {settlement.transfers.length > 0 && (
                        <TouchableOpacity
                          style={s.copySummaryBtn}
                          activeOpacity={0.8}
                          onPress={() => {
                            let text = `📋 สรุปเคลียร์เงินทริป: ${currentTrip?.title || "ทริป"}\nยอดรวมค่าใช้จ่าย: ฿${tripSpent.toLocaleString()}\n--------------------------------\n`;
                            settlement.transfers.forEach((tr, idx) => {
                              const fromName = getMemberName(tr.from);
                              const toName = getMemberName(tr.to);
                              text += `${idx + 1}. ${fromName} ➔ โอนให้ ${toName}: ฿${tr.amount.toLocaleString()}\n`;
                            });
                            text += `--------------------------------\n*โอนน้อยที่สุดเพียง ${settlement.transfers.length} ครั้ง ✨`;
                            Alert.alert("สรุปยอดเคลียร์เงิน", text);
                          }}
                        >
                          <Ionicons name="share-outline" size={13} color={C.pinkDark} />
                          <Text style={s.copySummaryBtnText}>แชร์สรุป</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {settlement.transfers.length === 0 ? (
                    <View style={s.settlementZeroBox}>
                      <Ionicons name="checkmark-circle" size={36} color={C.green} />
                      <Text style={s.settlementZeroTitle}>
                        ยอดเคลียร์ลงตัวทั้งหมด!
                      </Text>
                      <Text style={s.settlementZeroText}>
                        {tripExpenses.length === 0
                          ? "ยังไม่มีรายการค่าใช้จ่ายให้คำนวณ"
                          : "ทุกคนจ่ายส่วนของตนเองครบถ้วน ไม่มียอดค้างชำระ"}
                      </Text>
                      <TouchableOpacity
                        style={[s.copySummaryBtn, { marginTop: 12, backgroundColor: C.pinkLight }]}
                        onPress={() => openQrSetupModal(userId, name || "ฉัน")}
                      >
                        <Ionicons name="qr-code-outline" size={14} color={C.pinkDark} />
                        <Text style={[s.copySummaryBtnText, { marginLeft: 4 }]}>
                          ตั้งค่า QR Code รับเงินของคุณ
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    settlement.transfers.map((tr, index) => {
                      const fromName = getMemberName(tr.from);
                      const toName = getMemberName(tr.to);
                      const isMeSender = tr.from === userId;
                      const isMeReceiver = tr.to === userId;
                      const receiverQr =
                        memberQrMap[tr.to] || (tr.to === userId ? userQrData : null);

                      return (
                        <View
                          key={index}
                          style={[
                            s.transferCard,
                            (isMeSender || isMeReceiver) && s.transferCardMe,
                          ]}
                        >
                          <View style={s.transferPartyRow}>
                            <View style={s.transferParty}>
                              <View style={[s.transferAvatar, { backgroundColor: C.orangeLight }]}>
                                <Ionicons name="person" size={16} color={C.orange} />
                              </View>
                              <Text style={s.transferPartyName} numberOfLines={1}>
                                {fromName}
                              </Text>
                              <Text style={s.transferPartyRole}>ผู้โอนเงิน</Text>
                            </View>

                            <View style={s.transferMiddle}>
                              <Text style={s.transferAmount}>
                                ฿{tr.amount.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </Text>
                              <View style={s.transferArrowWrap}>
                                <View style={s.transferArrowLine} />
                                <Ionicons name="arrow-forward" size={15} color={C.pink} />
                              </View>
                              <Text style={s.transferStatusText}>ต้องโอนให้</Text>
                            </View>

                            <View style={s.transferParty}>
                              <View style={[s.transferAvatar, { backgroundColor: C.greenLight }]}>
                                <Ionicons name="person" size={16} color={C.green} />
                              </View>
                              <Text style={s.transferPartyName} numberOfLines={1}>
                                {toName}
                              </Text>
                              <Text style={s.transferPartyRole}>ผู้รับเงิน</Text>
                            </View>
                          </View>

                          <View style={s.transferCardDivider} />

                          {/* PROMINENT QR CODE ACTION BUTTON */}
                          <TouchableOpacity
                            style={s.transferQrFullBtn}
                            activeOpacity={0.8}
                            onPress={() => {
                              setViewingQrModal({
                                userId: tr.to,
                                name: toName,
                                amount: tr.amount,
                                promptpay: receiverQr?.promptpay || "",
                                bankName: receiverQr?.bankName || "",
                                accountName: receiverQr?.accountName || "",
                                qrUri:
                                  receiverQr?.qrUri ||
                                  receiverQr?.uri ||
                                  receiverQr?.base64 ||
                                  receiverQr?.qr ||
                                  "",
                              });
                            }}
                          >
                            <View style={s.transferQrFullBtnInner}>
                              <View style={s.transferQrIconBadge}>
                                <Ionicons name="qr-code" size={14} color={C.white} />
                              </View>
                              <Text style={s.transferQrFullBtnText}>
                                {receiverQr?.promptpay || receiverQr?.qrUri
                                  ? `กดเปิด QR Code โอนเงินให้ ${toName}`
                                  : `กดดู QR Code / พร้อมเพย์รับเงินของ ${toName}`}
                              </Text>
                              <Ionicons name="chevron-forward" size={16} color={C.pinkDark} />
                            </View>
                          </TouchableOpacity>

                          {!receiverQr?.promptpay && !receiverQr?.qrUri && (
                            <TouchableOpacity
                              style={{ marginTop: 6, alignSelf: "center", paddingVertical: 2 }}
                              activeOpacity={0.8}
                              onPress={() => openQrSetupModal(tr.to, toName)}
                            >
                              <Text style={{ fontFamily: "Prompt_500Medium", fontSize: 11, color: C.pinkDark }}>
                                {tr.to === userId ? "+ อัปโหลด QR ของฉัน" : `+ ตั้งค่าพร้อมเพย์ให้ ${toName}`}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })
                  )}
                </View>

                {/* INDIVIDUAL STATUS BREAKDOWN */}
                <Text style={[s.sectionTitle, { marginTop: 22 }]}>
                  สถานะของสมาชิกแต่ละคน
                </Text>

                <View style={s.breakdownCard}>
                  {members.map((member) => {
                    const mId = member.user_id;
                    const mName = getMemberName(mId);
                    const netAmt =
                      settlement.net[mId] !== undefined ? settlement.net[mId] : 0;
                    const paid = settlement.paidTotals[mId] || 0;
                    const owed = settlement.owedTotals[mId] || 0;
                    const roundedNet = Math.round(netAmt * 100) / 100;
                    const mQr = memberQrMap[mId] || (mId === userId ? userQrData : null);

                    return (
                      <View key={mId} style={s.breakdownRow}>
                        <View style={s.breakdownAvatar}>
                          <Ionicons name="person" size={16} color={C.pinkDark} />
                        </View>

                        <View style={{ flex: 1, paddingHorizontal: 10 }}>
                          <Text style={s.breakdownName}>
                            {mName}
                          </Text>
                          <Text style={s.breakdownSub}>
                            ออกไป ฿{paid.toLocaleString()} • ยอดหาร ฿{owed.toLocaleString()}
                          </Text>
                        </View>

                        {/* QR QUICK BUTTON FOR MEMBER */}
                        <TouchableOpacity
                          style={s.breakdownQrBtn}
                          activeOpacity={0.7}
                          onPress={() => {
                            setViewingQrModal({
                              userId: mId,
                              name: mName,
                              amount: roundedNet > 0.01 ? roundedNet : 0,
                              promptpay: mQr?.promptpay || "",
                              bankName: mQr?.bankName || "",
                              accountName: mQr?.accountName || "",
                              qrUri: mQr?.qrUri || mQr?.uri || mQr?.base64 || mQr?.qr || "",
                            });
                          }}
                        >
                          <Ionicons name="qr-code-outline" size={15} color={C.pinkDark} />
                        </TouchableOpacity>

                        <View style={{ alignItems: "flex-end" }}>
                          {roundedNet > 0.01 ? (
                            <View style={s.badgeNetPositive}>
                              <Text style={s.badgeNetPositiveText}>
                                + ได้รับ ฿{roundedNet.toLocaleString()}
                              </Text>
                            </View>
                          ) : roundedNet < -0.01 ? (
                            <View style={s.badgeNetNegative}>
                              <Text style={s.badgeNetNegativeText}>
                                - ต้องโอน ฿{Math.abs(roundedNet).toLocaleString()}
                              </Text>
                            </View>
                          ) : (
                            <View style={s.badgeNetZero}>
                              <Text style={s.badgeNetZeroText}>
                                พอดี ฿0
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>

          {bottomNav()}
        </View>
      </SafeAreaView>
    );
  }

  // ========================================
  // 29. PROFILE
  // ========================================

  if (screen === "profile") {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" />

        <View style={s.profileScreen}>
          <ScrollView
            contentContainerStyle={s.profileContent}
          >
            <Text style={s.profileTitle}>
              โปรไฟล์
            </Text>

            <Text style={s.subtitle}>
              จัดการข้อมูลส่วนตัวของคุณ
            </Text>

            <View style={s.profileCard}>
              <View style={s.profileAvatarWrap}>
                <View style={s.profileAvatarRing}>
                  <Duck style={s.profileDuck} />
                </View>
                <View style={s.profileVerifiedBadge}>
                  <Ionicons name="checkmark" size={12} color={C.white} />
                </View>
              </View>

              <Text style={s.profileName}>
                {name || "Trip Explorer"}
              </Text>

              <View style={s.profileBadge}>
                <Ionicons name="sparkles" size={11} color="#D97706" style={{ marginRight: 4 }} />
                <Text style={s.profileBadgeText}>TRIP EXPLORER</Text>
              </View>

              <View style={s.profileMetaRow}>
                <View style={s.profileMetaItem}>
                  <Ionicons name="mail-outline" size={13} color={C.textMuted} style={{ marginRight: 6 }} />
                  <Text style={s.profileEmail}>
                    {email || "ยังไม่ได้เข้าสู่ระบบ"}
                  </Text>
                </View>

                {!!phone && (
                  <View style={s.profileMetaItem}>
                    <Ionicons name="call-outline" size={13} color={C.textMuted} style={{ marginRight: 6 }} />
                    <Text style={s.profilePhone}>
                      {phone}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* QR CODE & PROMPTPAY SECTION */}
            <View style={s.profileQrCard}>
              <View style={s.profileQrHeader}>
                <View style={s.profileQrIconBox}>
                  <Ionicons name="qr-code-outline" size={20} color={C.pinkDark} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={s.profileQrTitle}>QR Code รับเงิน & พร้อมเพย์</Text>
                  <Text style={s.profileQrDesc}>
                    บันทึก QR Code ของคุณเพื่อให้เพื่อนในทริปสามารถสแกนโอนเงินเข้าบัญชีคุณได้ทันทีจากหน้าสรุปเงิน
                  </Text>
                </View>
              </View>

              {userQrData?.qrUri || userQrData?.base64 || userQrData?.promptpay ? (
                <View style={s.userQrPreviewBox}>
                  <View style={s.userQrThumbWrap}>
                    {userQrData.qrUri || userQrData.base64 ? (
                      <Image
                        source={{ uri: userQrData.qrUri || userQrData.base64 }}
                        style={s.userQrThumb}
                        resizeMode="cover"
                      />
                    ) : (
                      <Image
                        source={{
                          uri: `https://promptpay.io/${(userQrData.promptpay || "").replace(/[^0-9]/g, "")}.png`,
                        }}
                        style={s.userQrThumb}
                        resizeMode="cover"
                      />
                    )}
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.userQrPromptpayText}>
                      {userQrData.promptpay
                        ? `พร้อมเพย์: ${userQrData.promptpay}`
                        : "อัปโหลดรูป QR Code แล้ว"}
                    </Text>
                    {!!userQrData.bankName && (
                      <Text style={s.userQrBankText}>
                        ธนาคาร: {userQrData.bankName} {userQrData.accountName ? `(${userQrData.accountName})` : ""}
                      </Text>
                    )}
                    <View style={s.userQrActionsRow}>
                      <TouchableOpacity
                        style={s.userQrActionBtn}
                        activeOpacity={0.8}
                        onPress={() =>
                          setViewingQrModal({
                            userId,
                            name: name || "ฉัน",
                            amount: 0,
                            promptpay: userQrData.promptpay,
                            bankName: userQrData.bankName,
                            accountName: userQrData.accountName,
                            qrUri: userQrData.qrUri || userQrData.base64,
                          })
                        }
                      >
                        <Ionicons name="eye-outline" size={13} color={C.pinkDark} />
                        <Text style={s.userQrActionText}>ดู QR</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={s.userQrActionBtn}
                        activeOpacity={0.8}
                        onPress={() => openQrSetupModal(userId, name || "ฉัน")}
                      >
                        <Ionicons name="create-outline" size={13} color={C.pinkDark} />
                        <Text style={s.userQrActionText}>แก้ไข</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[s.userQrActionBtn, { borderColor: "#FCA5A5" }]}
                        activeOpacity={0.8}
                        onPress={() => removeQrData(userId)}
                      >
                        <Ionicons name="trash-outline" size={13} color="#DC2626" />
                        <Text style={[s.userQrActionText, { color: "#DC2626" }]}>ลบ</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={s.noQrPromptBox}
                  activeOpacity={0.8}
                  onPress={() => openQrSetupModal(userId, name || "ฉัน")}
                >
                  <View style={s.noQrDashedInner}>
                    <Ionicons name="cloud-upload-outline" size={26} color={C.pink} />
                    <Text style={s.noQrTitle}>+ อัปโหลด QR Code / เบอร์พร้อมเพย์ของคุณ</Text>
                    <Text style={s.noQrSubtitle}>
                      เพื่อแสดง QR Code รับเงินในหน้าสรุปยอดโอนของทริป
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            <View style={s.settingsCard}>
              <TouchableOpacity
                style={s.settingRow}
                activeOpacity={0.7}
                onPress={() =>
                  Alert.alert(
                    "ข้อมูลส่วนตัว",
                    "ระบบแก้ไขโปรไฟล์จะเปิดให้ใช้งานในเวอร์ชันถัดไป"
                  )
                }
              >
                <View style={[s.settingIconBox, { backgroundColor: C.pinkLight }]}>
                  <Ionicons name="person-outline" size={18} color={C.pinkDark} />
                </View>

                <Text style={s.settingText}>
                  ข้อมูลส่วนตัว
                </Text>

                <Ionicons name="chevron-forward" size={18} color={C.muted} />
              </TouchableOpacity>

              <View style={s.divider} />

              <TouchableOpacity
                style={s.settingRow}
                activeOpacity={0.7}
                onPress={() =>
                  Alert.alert(
                    "การแจ้งเตือน",
                    "ระบบการแจ้งเตือนเปิดใช้งานอัตโนมัติเรียบร้อยแล้ว"
                  )
                }
              >
                <View style={[s.settingIconBox, { backgroundColor: C.blueLight }]}>
                  <Ionicons name="notifications-outline" size={18} color={C.blue} />
                </View>

                <Text style={s.settingText}>
                  การแจ้งเตือน
                </Text>

                <Ionicons name="chevron-forward" size={18} color={C.muted} />
              </TouchableOpacity>

              <View style={s.divider} />

              <TouchableOpacity
                style={s.settingRow}
                activeOpacity={0.7}
                onPress={() =>
                  Alert.alert(
                    "สกุลเงินที่ใช้",
                    `สกุลเงินหลักปัจจุบันของคุณคือ ${currency}`
                  )
                }
              >
                <View style={[s.settingIconBox, { backgroundColor: C.greenLight }]}>
                  <Ionicons name="cash-outline" size={18} color={C.green} />
                </View>

                <Text style={s.settingText}>
                  สกุลเงิน ({currency})
                </Text>

                <Ionicons name="chevron-forward" size={18} color={C.muted} />
              </TouchableOpacity>
            </View>

            <Button
              title="ออกจากระบบ"
              icon="log-out-outline"
              outline
              style={{ marginTop: 22, borderColor: "#F3C5CD" }}
              onPress={logout}
            />
          </ScrollView>

          {bottomNav()}
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

// ==========================================
// 30. DESIGN SYSTEM
// ==========================================

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.pinkBg,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: C.pinkBg,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    fontFamily: "Prompt_500Medium",
    color: C.textMuted,
    marginTop: 14,
    fontSize: 14,
  },

  brand: {
    alignItems: "center",
    justifyContent: "center",
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  brandName: {
    fontFamily: "Prompt_700Bold",
    color: C.pink,
    fontSize: 32,
    letterSpacing: -0.5,
  },

  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.pinkDark,
    marginLeft: 4,
    marginTop: 6,
  },

  brandTagline: {
    fontFamily: "Prompt_400Regular",
    color: C.textMuted,
    fontSize: 12,
    marginTop: 3,
    letterSpacing: 0.2,
  },

  button: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: C.pink,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    shadowColor: C.pinkDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 3,
  },

  buttonText: {
    fontFamily: "Prompt_600SemiBold",
    color: C.white,
    fontSize: 15,
    letterSpacing: 0.2,
  },

  buttonOutline: {
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.border,
    shadowOpacity: 0,
    elevation: 0,
  },

  buttonOutlineText: {
    fontFamily: "Prompt_600SemiBold",
    color: C.text,
  },

  field: {
    marginBottom: 14,
  },

  label: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 12,
    color: C.text,
    marginBottom: 7,
    marginLeft: 3,
  },

  inputContainer: {
    minHeight: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 1,
  },

  inputIcon: {
    marginRight: 4,
  },

  input: {
    flex: 1,
    fontFamily: "Prompt_400Regular",
    fontSize: 13,
    color: C.text,
    paddingVertical: 10,
  },

  header: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
  },

  backText: {
    fontSize: 22,
    color: C.text,
  },

  headerTitle: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 16,
    color: C.text,
    letterSpacing: -0.2,
  },

  // LANDING

  landing: {
    flex: 1,
    backgroundColor: "#FFF8F9",
    justifyContent: "space-between",
  },

  landingTop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 20,
  },

  landingHeaderWrap: {
    alignItems: "center",
    marginBottom: 12,
  },

  luxuryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.pinkLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
  },

  luxuryBadgeText: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 10,
    color: C.pinkDark,
    marginLeft: 5,
    letterSpacing: 0.8,
  },

  landingMascotContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  mascotAura: {
    position: "absolute",
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "#FFEBF0",
    opacity: 0.85,
  },

  landingDuck: {
    width: 230,
    height: 230,
  },

  landingPanel: {
    backgroundColor: C.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 26,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 36 : 28,
    alignItems: "center",
    shadowColor: C.shadowMedium,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 10,
  },

  handle: {
    width: 44,
    height: 4,
    borderRadius: 3,
    backgroundColor: "#E6D7DB",
    marginBottom: 18,
  },

  landingTitle: {
    fontFamily: "Prompt_700Bold",
    color: C.text,
    textAlign: "center",
    fontSize: 24,
    lineHeight: 36,
    letterSpacing: -0.3,
  },

  landingDesc: {
    fontFamily: "Prompt_400Regular",
    color: C.textMuted,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 22,
    marginTop: 8,
  },

  featurePillRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 18,
    marginBottom: 4,
  },

  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.pinkBg,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    marginHorizontal: 3,
  },

  featurePillText: {
    fontFamily: "Prompt_500Medium",
    fontSize: 11,
    color: C.text,
    marginLeft: 4,
  },

  landingButton: {
    width: "100%",
    marginTop: 22,
  },

  // LOGIN

  loginContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingBottom: 30,
    backgroundColor: C.pinkBg,
  },

  loginMascot: {
    alignItems: "center",
    marginTop: 4,
    marginBottom: 14,
  },

  loginMascotRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: C.pinkLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: C.white,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },

  loginDuck: {
    width: 85,
    height: 85,
  },

  loginHeading: {
    alignItems: "center",
    marginBottom: 20,
  },

  pageTitle: {
    fontFamily: "Prompt_700Bold",
    color: C.text,
    fontSize: 24,
    letterSpacing: -0.4,
  },

  subtitle: {
    fontFamily: "Prompt_400Regular",
    color: C.textMuted,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 20,
    textAlign: "center",
  },

  formCard: {
    backgroundColor: C.white,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },

  forgot: {
    alignSelf: "flex-end",
    marginTop: 2,
    marginBottom: 16,
  },

  link: {
    fontFamily: "Prompt_600SemiBold",
    color: C.pinkDark,
    fontSize: 12,
  },

  orRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
  },

  line: {
    height: 1,
    flex: 1,
    backgroundColor: C.border,
  },

  orText: {
    fontFamily: "Prompt_400Regular",
    color: C.muted,
    fontSize: 12,
    marginHorizontal: 12,
  },

  social: {
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 1,
  },

  socialText: {
    fontFamily: "Prompt_500Medium",
    color: C.text,
    fontSize: 13,
  },

  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },

  muted: {
    fontFamily: "Prompt_400Regular",
    color: C.muted,
    fontSize: 12,
  },

  // REGISTER

  registerContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingBottom: 30,
    backgroundColor: C.pinkBg,
  },

  setupTitle: {
    fontFamily: "Prompt_700Bold",
    textAlign: "center",
    color: C.text,
    fontSize: 23,
    letterSpacing: -0.3,
    marginTop: 6,
  },

  setupSubtitle: {
    fontFamily: "Prompt_400Regular",
    color: C.textMuted,
    textAlign: "center",
    fontSize: 12,
    marginTop: 4,
  },

  setupAvatarWrap: {
    alignSelf: "center",
    marginTop: 16,
    marginBottom: 16,
  },

  setupAvatarCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: C.pinkLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: C.white,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },

  setupDuck: {
    width: 95,
    height: 95,
  },

  setupFormCard: {
    backgroundColor: C.white,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },

  currencySelect: {
    minHeight: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 14,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 1,
  },

  currencyText: {
    fontFamily: "Prompt_500Medium",
    flex: 1,
    fontSize: 13,
    color: C.text,
  },

  // APP / HOME

  appScreen: {
    flex: 1,
    backgroundColor: C.pinkBg,
  },

  homeContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24,
  },

  homeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  homeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.pinkLight,
    overflow: "hidden",
    marginRight: 12,
    borderWidth: 2,
    borderColor: C.white,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },

  homeAvatarImage: {
    width: "100%",
    height: "100%",
  },

  homeNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  homeName: {
    fontFamily: "Prompt_700Bold",
    fontSize: 16,
    color: C.text,
    letterSpacing: -0.2,
  },

  homeGreeting: {
    fontFamily: "Prompt_400Regular",
    fontSize: 11,
    color: C.textMuted,
    marginTop: 2,
  },

  notification: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.7,
    shadowRadius: 4,
  },

  notificationDot: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.pinkDark,
  },

  tripBanner: {
    minHeight: 140,
    backgroundColor: C.pink,
    borderRadius: 24,
    padding: 20,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: C.pinkDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 5,
    flexDirection: "row",
    alignItems: "center",
  },

  bannerContent: {
    flex: 1,
    zIndex: 2,
  },

  bannerTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.22)",
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 8,
  },

  bannerTagText: {
    fontFamily: "Prompt_600SemiBold",
    color: C.white,
    fontSize: 10,
    marginLeft: 4,
    letterSpacing: 0.6,
  },

  bannerTitle: {
    fontFamily: "Prompt_700Bold",
    color: C.white,
    fontSize: 20,
    letterSpacing: -0.3,
  },

  bannerSubtitle: {
    fontFamily: "Prompt_400Regular",
    color: "rgba(255,255,255,0.92)",
    fontSize: 12,
    marginTop: 3,
  },

  createButton: {
    marginTop: 14,
    backgroundColor: C.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "rgba(0,0,0,0.12)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },

  createButtonText: {
    fontFamily: "Prompt_600SemiBold",
    color: C.pinkDark,
    fontSize: 12,
  },

  bannerFlightBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "15deg" }],
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 4,
  },

  sectionTitle: {
    fontFamily: "Prompt_700Bold",
    color: C.text,
    fontSize: 16,
    letterSpacing: -0.2,
  },

  seeAll: {
    fontFamily: "Prompt_600SemiBold",
    color: C.pinkDark,
    fontSize: 12,
  },

  // GROUPS

  groupActionCard: {
    backgroundColor: C.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
    marginBottom: 16,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 2,
  },

  groupDetailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  groupStatusTag: {
    backgroundColor: C.pinkLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  groupStatusTagText: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 10,
    color: C.pinkDark,
  },

  inviteCodeBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.pinkBg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: C.pink,
    borderRadius: 16,
    padding: 12,
    marginVertical: 10,
  },

  inviteCodeLabel: {
    fontFamily: "Prompt_400Regular",
    fontSize: 10,
    color: C.textMuted,
  },

  inviteCodeValue: {
    fontFamily: "Prompt_700Bold",
    fontSize: 17,
    color: C.pinkDark,
    letterSpacing: 1.5,
    marginTop: 2,
  },

  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },

  copyButtonText: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 11,
    color: C.pinkDark,
    marginLeft: 4,
  },

  memberHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 8,
  },

  memberCountBadge: {
    backgroundColor: C.pinkLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },

  memberCountBadgeText: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 10,
    color: C.pinkDark,
  },

  roleBadge: {
    backgroundColor: C.pinkLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },

  roleBadgeOwner: {
    backgroundColor: "#FEF3C7",
  },

  roleBadgeText: {
    fontFamily: "Prompt_500Medium",
    fontSize: 10,
    color: C.pinkDark,
  },

  roleBadgeTextOwner: {
    color: "#D97706",
  },

  groupCardTitle: {
    fontFamily: "Prompt_700Bold",
    color: C.text,
    fontSize: 15,
    letterSpacing: -0.2,
  },

  groupCardDesc: {
    fontFamily: "Prompt_400Regular",
    color: C.textMuted,
    fontSize: 12,
    marginTop: 3,
    marginBottom: 14,
  },

  groupItem: {
    minHeight: 72,
    borderRadius: 18,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: "row",
    alignItems: "center",
    padding: 13,
    marginBottom: 10,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
    elevation: 1,
  },

  groupItemActive: {
    borderColor: C.pink,
    borderWidth: 1.8,
    backgroundColor: "#FFFDFC",
  },

  groupIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: C.pinkLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  groupItemName: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 14,
    color: C.text,
  },

  groupItemRole: {
    fontFamily: "Prompt_400Regular",
    fontSize: 11,
    color: C.textMuted,
    marginTop: 2,
  },

  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },

  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.pinkLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },

  memberName: {
    fontFamily: "Prompt_500Medium",
    color: C.text,
    fontSize: 13,
  },

  activeGroupCard: {
    minHeight: 70,
    borderRadius: 20,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginBottom: 20,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 2,
  },

  activeGroupBadge: {
    padding: 4,
  },

  // TRIPS

  tripCard: {
    minHeight: 96,
    borderRadius: 20,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 2,
  },

  tripPhoto: {
    width: 68,
    height: 68,
    borderRadius: 16,
    backgroundColor: C.blueLight,
    alignItems: "center",
    justifyContent: "center",
  },

  tripInfo: {
    flex: 1,
    marginLeft: 14,
  },

  tripTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  tripName: {
    fontFamily: "Prompt_600SemiBold",
    color: C.text,
    fontSize: 14,
    flex: 1,
    marginRight: 6,
  },

  destinationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.pinkLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },

  destinationText: {
    fontFamily: "Prompt_500Medium",
    color: C.pinkDark,
    fontSize: 10,
    marginLeft: 3,
  },

  tripBudgetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  tripBudgetLabel: {
    fontFamily: "Prompt_400Regular",
    color: C.muted,
    fontSize: 11,
  },

  tripBudgetValue: {
    fontFamily: "Prompt_600SemiBold",
    color: C.text,
    fontSize: 13,
  },

  emptyTrip: {
    backgroundColor: C.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    padding: 22,
    marginBottom: 20,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 1,
  },

  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.pinkLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  emptyTripTitle: {
    fontFamily: "Prompt_600SemiBold",
    color: C.text,
    fontSize: 14,
  },

  emptyTripText: {
    fontFamily: "Prompt_400Regular",
    color: C.textMuted,
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
    lineHeight: 18,
  },

  // BUDGET - EXECUTIVE FINANCIAL CARD

  budgetCard: {
    backgroundColor: C.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
    marginBottom: 22,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },

  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  budgetHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  budgetHeaderTitle: {
    fontFamily: "Prompt_600SemiBold",
    color: C.text,
    fontSize: 14,
    marginLeft: 6,
  },

  currencyPill: {
    backgroundColor: C.pinkLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },

  currencyPillText: {
    fontFamily: "Prompt_600SemiBold",
    color: C.pinkDark,
    fontSize: 10,
  },

  budgetHero: {
    marginBottom: 12,
  },

  budgetHeroLabel: {
    fontFamily: "Prompt_400Regular",
    color: C.muted,
    fontSize: 11,
  },

  budgetHeroValue: {
    fontFamily: "Prompt_700Bold",
    color: C.text,
    fontSize: 26,
    letterSpacing: -0.5,
    marginTop: 2,
  },

  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F4ECED",
    overflow: "hidden",
    marginBottom: 14,
  },

  progressBarFill: {
    height: "100%",
    backgroundColor: C.pink,
    borderRadius: 4,
  },

  budgetChipsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.borderLight,
  },

  budgetChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  budgetDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },

  budgetChipLabel: {
    fontFamily: "Prompt_400Regular",
    color: C.muted,
    fontSize: 10,
  },

  budgetChipValue: {
    fontFamily: "Prompt_600SemiBold",
    color: C.text,
    fontSize: 12,
    marginTop: 1,
  },

  budgetChipDivider: {
    width: 1,
    height: 26,
    backgroundColor: C.border,
    marginHorizontal: 10,
  },

  // QUICK MENU

  quickRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  quickItem: {
    width: "23%",
    minHeight: 88,
    borderRadius: 20,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 1,
  },

  quickIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },

  quickLabel: {
    fontFamily: "Prompt_500Medium",
    color: C.text,
    fontSize: 11,
    textAlign: "center",
  },

  // PROFILE

  profileScreen: {
    flex: 1,
    backgroundColor: C.pinkBg,
  },

  profileContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 25,
  },

  profileTitle: {
    fontFamily: "Prompt_700Bold",
    color: C.text,
    fontSize: 24,
    letterSpacing: -0.3,
  },

  profileCard: {
    alignItems: "center",
    backgroundColor: C.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    padding: 22,
    marginTop: 18,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },

  profileAvatarWrap: {
    position: "relative",
    marginBottom: 12,
  },

  profileAvatarRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: C.pinkLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: C.white,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },

  profileDuck: {
    width: 80,
    height: 80,
  },

  profileVerifiedBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.green,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: C.white,
  },

  profileName: {
    fontFamily: "Prompt_700Bold",
    color: C.text,
    fontSize: 19,
    letterSpacing: -0.3,
  },

  profileBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    marginBottom: 12,
  },

  profileBadgeText: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 10,
    color: "#D97706",
    letterSpacing: 0.6,
  },

  profileMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },

  profileMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
    marginVertical: 3,
  },

  profileEmail: {
    fontFamily: "Prompt_400Regular",
    color: C.textMuted,
    fontSize: 12,
  },

  profilePhone: {
    fontFamily: "Prompt_400Regular",
    color: C.textMuted,
    fontSize: 12,
  },

  settingsCard: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 18,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 2,
  },

  settingRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
  },

  settingIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  settingText: {
    fontFamily: "Prompt_500Medium",
    flex: 1,
    color: C.text,
    fontSize: 13,
  },

  divider: {
    height: 1,
    backgroundColor: C.borderLight,
    marginVertical: 12,
  },

  // MODALS

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(20,10,15,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalCard: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: C.white,
    borderRadius: 28,
    padding: 24,
    shadowColor: "rgba(0,0,0,0.2)",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 10,
  },

  modalTitle: {
    fontFamily: "Prompt_700Bold",
    color: C.text,
    fontSize: 20,
    textAlign: "center",
    letterSpacing: -0.3,
  },

  modalSubtitle: {
    fontFamily: "Prompt_400Regular",
    color: C.textMuted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 18,
  },

  // BOTTOM NAV

  bottomNav: {
    height: 70,
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: C.borderLight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    shadowColor: C.shadowMedium,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    paddingBottom: Platform.OS === "ios" ? 10 : 0,
  },

  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  navLabel: {
    fontFamily: "Prompt_500Medium",
    color: C.muted,
    fontSize: 10,
    marginTop: 2,
  },

  navLabelActive: {
    fontFamily: "Prompt_600SemiBold",
    color: C.pinkDark,
  },

  navIconWrapper: {
    width: 38,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },

  navIconWrapperActive: {
    backgroundColor: C.pinkLight,
  },

  navActiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.pinkDark,
    marginTop: 2,
  },

  // TRIP & EXPENSES DETAIL STYLES
  tripDetailHintRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C.borderLight,
  },

  tripDetailHintText: {
    fontFamily: "Prompt_500Medium",
    fontSize: 11,
    color: C.pinkDark,
    marginLeft: 4,
    flex: 1,
  },

  otherTripCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 2,
  },

  otherTripIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: C.pinkLight,
    alignItems: "center",
    justifyContent: "center",
  },

  otherTripTitle: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 14,
    color: C.text,
  },

  otherTripSub: {
    fontFamily: "Prompt_400Regular",
    fontSize: 11,
    color: C.textMuted,
    marginTop: 2,
  },

  modalFieldTitle: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 13,
    color: C.text,
    marginBottom: 6,
  },

  payerChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: C.pinkBg,
    borderWidth: 1,
    borderColor: C.border,
    marginRight: 8,
  },

  payerChipActive: {
    backgroundColor: C.pinkDark,
    borderColor: C.pinkDark,
  },

  payerChipText: {
    fontFamily: "Prompt_500Medium",
    fontSize: 12,
    color: C.text,
  },

  payerChipTextActive: {
    color: C.white,
  },

  splitHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  selectAllText: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 12,
    color: C.pinkDark,
  },

  participantsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },

  participantCheckItem: {
    width: "48%",
    margin: "1%",
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: C.pinkBg,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: "row",
    alignItems: "center",
  },

  participantCheckItemActive: {
    backgroundColor: C.pinkLight,
    borderColor: C.pink,
  },

  participantCheckName: {
    fontFamily: "Prompt_400Regular",
    fontSize: 12,
    color: C.text,
    marginLeft: 8,
    flex: 1,
  },

  participantCheckNameActive: {
    fontFamily: "Prompt_600SemiBold",
    color: C.pinkDark,
  },

  splitPreviewCard: {
    backgroundColor: C.pinkLight,
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#F7D1DA",
  },

  splitPreviewText: {
    fontFamily: "Prompt_500Medium",
    fontSize: 12,
    color: C.text,
    marginLeft: 8,
    flex: 1,
  },

  splitPreviewHighlight: {
    fontFamily: "Prompt_700Bold",
    color: C.pinkDark,
    fontSize: 13,
  },

  tripDetailHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },

  tripDetailHeaderTitle: {
    fontFamily: "Prompt_700Bold",
    fontSize: 17,
    color: C.text,
    letterSpacing: -0.3,
  },

  tripDetailHeaderSub: {
    fontFamily: "Prompt_400Regular",
    fontSize: 11,
    color: C.textMuted,
    marginLeft: 4,
  },

  tripDetailAddBtn: {
    backgroundColor: C.pinkDark,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    shadowColor: C.pinkDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },

  tripDetailAddBtnText: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 12,
    color: C.white,
    marginLeft: 4,
  },

  tripDetailContent: {
    padding: 20,
    paddingBottom: 40,
  },

  tripHeroCard: {
    backgroundColor: C.white,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 16,
  },

  tripHeroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  tripHeroBudgetLabel: {
    fontFamily: "Prompt_400Regular",
    fontSize: 12,
    color: C.textMuted,
  },

  tripHeroSpentText: {
    fontFamily: "Prompt_700Bold",
    fontSize: 26,
    color: C.text,
    letterSpacing: -0.5,
    marginTop: 2,
  },

  tripHeroBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.pinkLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },

  tripHeroBadgeText: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 11,
    color: C.pinkDark,
  },

  tripHeroStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  tripHeroStat: {
    flex: 1,
    alignItems: "center",
  },

  tripHeroStatLabel: {
    fontFamily: "Prompt_400Regular",
    fontSize: 11,
    color: C.muted,
  },

  tripHeroStatValue: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 15,
    color: C.text,
    marginTop: 2,
  },

  tripHeroStatDivider: {
    width: 1,
    height: 26,
    backgroundColor: C.borderLight,
  },

  segmentTabsContainer: {
    flexDirection: "row",
    backgroundColor: "#F2E8EB",
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
  },

  segmentTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
  },

  segmentTabActive: {
    backgroundColor: C.white,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  segmentTabText: {
    fontFamily: "Prompt_500Medium",
    fontSize: 12,
    color: C.textMuted,
    marginLeft: 6,
  },

  segmentTabTextActive: {
    fontFamily: "Prompt_600SemiBold",
    color: C.pinkDark,
  },

  tabSection: {
    marginBottom: 20,
  },

  expenseItemCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 2,
  },

  expenseTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  expenseIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: C.pinkLight,
    alignItems: "center",
    justifyContent: "center",
  },

  expenseItemTitle: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 15,
    color: C.text,
  },

  expenseDate: {
    fontFamily: "Prompt_400Regular",
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
  },

  expenseItemAmount: {
    fontFamily: "Prompt_700Bold",
    fontSize: 16,
    color: C.text,
    letterSpacing: -0.3,
  },

  expenseDivider: {
    height: 1,
    backgroundColor: C.borderLight,
    marginVertical: 10,
  },

  expenseMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
  },

  expensePayerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.greenLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 6,
    marginVertical: 2,
  },

  expensePayerText: {
    fontFamily: "Prompt_400Regular",
    fontSize: 11,
    color: C.green,
    marginLeft: 4,
  },

  expenseShareBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.blueLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginVertical: 2,
  },

  expenseShareText: {
    fontFamily: "Prompt_500Medium",
    fontSize: 11,
    color: C.blue,
    marginLeft: 4,
  },

  expenseParticipantsWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 2,
  },

  expenseParticipantsLabel: {
    fontFamily: "Prompt_500Medium",
    fontSize: 11,
    color: C.textMuted,
  },

  expenseParticipantsNames: {
    fontFamily: "Prompt_400Regular",
    fontSize: 11,
    color: C.muted,
    flex: 1,
  },

  algoBanner: {
    backgroundColor: C.pinkLight,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F7D1DA",
  },

  algoIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
  },

  algoBannerTitle: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 12,
    color: C.pinkDark,
  },

  algoBannerDesc: {
    fontFamily: "Prompt_400Regular",
    fontSize: 10,
    color: C.textMuted,
    marginTop: 2,
  },

  settlementCard: {
    backgroundColor: C.white,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 2,
  },

  settlementCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  settlementCardTitle: {
    fontFamily: "Prompt_700Bold",
    fontSize: 15,
    color: C.text,
  },

  copySummaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.pinkLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },

  copySummaryBtnText: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 11,
    color: C.pinkDark,
    marginLeft: 4,
  },

  settlementZeroBox: {
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  settlementZeroTitle: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 15,
    color: C.green,
    marginTop: 8,
  },

  settlementZeroText: {
    fontFamily: "Prompt_400Regular",
    fontSize: 12,
    color: C.textMuted,
    marginTop: 4,
    textAlign: "center",
  },

  transferCard: {
    flexDirection: "column",
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 2,
  },

  transferCardMe: {
    borderColor: C.pink,
    borderWidth: 1.5,
    backgroundColor: "#FFF9FA",
  },

  transferQrFullBtn: {
    width: "100%",
    backgroundColor: C.pinkLight,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#F7D1DA",
    marginTop: 2,
  },

  transferQrFullBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  transferQrIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.pinkDark,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  transferQrFullBtnText: {
    flex: 1,
    fontFamily: "Prompt_600SemiBold",
    fontSize: 12,
    color: C.pinkDark,
  },

  breakdownQrBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.pinkLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F7D1DA",
    marginRight: 8,
  },

  transferParty: {
    flex: 1,
    alignItems: "center",
  },

  transferAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },

  transferPartyName: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 12,
    color: C.text,
    textAlign: "center",
  },

  transferPartyRole: {
    fontFamily: "Prompt_400Regular",
    fontSize: 10,
    color: C.textMuted,
    marginTop: 1,
  },

  transferMiddle: {
    alignItems: "center",
    paddingHorizontal: 8,
  },

  transferAmount: {
    fontFamily: "Prompt_700Bold",
    fontSize: 15,
    color: C.pinkDark,
    letterSpacing: -0.3,
  },

  transferArrowWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
  },

  transferArrowLine: {
    width: 20,
    height: 2,
    backgroundColor: C.pink,
    marginRight: 2,
  },

  transferStatusText: {
    fontFamily: "Prompt_400Regular",
    fontSize: 10,
    color: C.muted,
  },

  breakdownCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 2,
    marginTop: 8,
  },

  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },

  breakdownAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.pinkLight,
    alignItems: "center",
    justifyContent: "center",
  },

  breakdownName: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 13,
    color: C.text,
  },

  breakdownSub: {
    fontFamily: "Prompt_400Regular",
    fontSize: 10,
    color: C.muted,
    marginTop: 2,
  },

  badgeNetPositive: {
    backgroundColor: C.greenLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },

  badgeNetPositiveText: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 11,
    color: C.green,
  },

  badgeNetNegative: {
    backgroundColor: C.orangeLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },

  badgeNetNegativeText: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 11,
    color: C.orange,
  },

  badgeNetZero: {
    backgroundColor: "#F3EFF1",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },

  badgeNetZeroText: {
    fontFamily: "Prompt_500Medium",
    fontSize: 11,
    color: C.textMuted,
  },

  editNickBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.pinkLight,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F7D1DA",
  },

  editNickBtnText: {
    fontFamily: "Prompt_500Medium",
    fontSize: 11,
    color: C.pinkDark,
    marginLeft: 3,
  },

  memberRoleSub: {
    fontFamily: "Prompt_400Regular",
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
  },

  myTagText: {
    fontFamily: "Prompt_500Medium",
    fontSize: 11,
    color: C.pinkDark,
  },

  deleteExpenseBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginTop: 6,
  },

  deleteExpenseBtnText: {
    fontFamily: "Prompt_500Medium",
    fontSize: 11,
    color: "#DC2626",
    marginLeft: 3,
  },

  // SPLIT MODE SELECTOR STYLES
  splitModeSelector: {
    flexDirection: "row",
    backgroundColor: "#F3EFF1",
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
  },

  splitModeTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 11,
  },

  splitModeTabActive: {
    backgroundColor: C.pink,
    shadowColor: C.pink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },

  splitModeTabText: {
    fontFamily: "Prompt_500Medium",
    fontSize: 12,
    color: C.textMuted,
    marginLeft: 5,
  },

  splitModeTabTextActive: {
    color: C.white,
    fontFamily: "Prompt_600SemiBold",
  },

  itemizedBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },

  itemizedBannerText: {
    flex: 1,
    fontFamily: "Prompt_400Regular",
    fontSize: 11,
    color: "#92400E",
    marginLeft: 8,
    lineHeight: 16,
  },

  subItemCard: {
    backgroundColor: C.white,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.borderLight,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 1,
  },

  subItemCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  subItemNumBadge: {
    backgroundColor: C.pinkLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },

  subItemNumBadgeText: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 11,
    color: C.pinkDark,
  },

  subItemInputRow: {
    flexDirection: "row",
    marginBottom: 8,
  },

  subItemInput: {
    backgroundColor: "#FAF7F8",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: "Prompt_400Regular",
    fontSize: 13,
    color: C.text,
  },

  subItemParticipantsWrap: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C.borderLight,
  },

  subItemParticipantsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  subItemParticipantsLabel: {
    fontFamily: "Prompt_500Medium",
    fontSize: 11,
    color: C.textMuted,
  },

  subItemSelectAllBtn: {
    fontFamily: "Prompt_500Medium",
    fontSize: 11,
    color: C.pinkDark,
  },

  subItemChipsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },

  subItemChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3EFF1",
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },

  subItemChipActive: {
    backgroundColor: C.pinkDark,
    borderColor: C.pink,
  },

  subItemChipText: {
    fontFamily: "Prompt_400Regular",
    fontSize: 11,
    color: C.text,
  },

  subItemChipTextActive: {
    color: C.white,
    fontFamily: "Prompt_500Medium",
  },

  subItemSharePreview: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    paddingHorizontal: 4,
  },

  subItemSharePreviewText: {
    fontFamily: "Prompt_400Regular",
    fontSize: 11,
    color: C.blue,
    marginLeft: 4,
  },

  addSubItemBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.pinkLight,
    borderWidth: 1.5,
    borderColor: "#F7D1DA",
    borderStyle: "dashed",
    borderRadius: 14,
    paddingVertical: 11,
    marginBottom: 14,
  },

  addSubItemBtnText: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 13,
    color: C.pinkDark,
    marginLeft: 6,
  },

  itemizedTotalCard: {
    backgroundColor: "#FDF4F6",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FCE7EC",
    marginBottom: 8,
  },

  itemizedTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  itemizedTotalLabel: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 13,
    color: C.text,
  },

  itemizedTotalValue: {
    fontFamily: "Prompt_700Bold",
    fontSize: 16,
    color: C.pinkDark,
  },

  itemizedDivider: {
    height: 1,
    backgroundColor: "#F5D0D9",
    marginVertical: 8,
  },

  itemizedBreakdownTitle: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 11,
    color: C.textMuted,
    marginBottom: 6,
  },

  itemizedMemberShareRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 3,
  },

  itemizedMemberShareName: {
    fontFamily: "Prompt_400Regular",
    fontSize: 12,
    color: C.text,
  },

  itemizedMemberShareAmt: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 12,
    color: C.pinkDark,
  },

  // ITEM CARD IN EXPENSE LIST
  expenseItemizedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },

  expenseItemizedBadgeText: {
    fontFamily: "Prompt_500Medium",
    fontSize: 10,
    color: "#92400E",
    marginLeft: 4,
  },

  accordionToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.pinkLight,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginTop: 4,
  },

  accordionToggleText: {
    fontFamily: "Prompt_500Medium",
    fontSize: 11,
    color: C.pinkDark,
    marginLeft: 4,
  },

  subItemsAccordionCard: {
    backgroundColor: "#FAF7F8",
    borderRadius: 12,
    padding: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: C.borderLight,
  },

  subItemAccordionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },

  subItemAccordionName: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 12,
    color: C.text,
  },

  subItemAccordionEaters: {
    fontFamily: "Prompt_400Regular",
    fontSize: 10,
    color: C.muted,
    marginTop: 1,
  },

  subItemAccordionPrice: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 12,
    color: C.pinkDark,
  },

  subItemAccordionShare: {
    fontFamily: "Prompt_400Regular",
    fontSize: 9,
    color: C.muted,
  },

  // SETTLEMENT TRANSFER CARD WITH QR
  transferPartyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },

  transferCardDivider: {
    height: 1,
    backgroundColor: C.borderLight,
    marginVertical: 10,
    width: "100%",
  },

  transferCardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },

  transferQrActionPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.pinkLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F7D1DA",
  },

  transferQrActionPillText: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 11,
    color: C.pinkDark,
    marginLeft: 5,
  },

  transferQuickAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },

  transferQuickAddBtnText: {
    fontFamily: "Prompt_500Medium",
    fontSize: 11,
    color: C.pinkDark,
    marginLeft: 3,
  },

  // VIEW QR MODAL
  modalAmountBanner: {
    backgroundColor: "#FEF2F4",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FCE7EC",
    alignItems: "center",
    marginBottom: 14,
  },

  modalAmountLabel: {
    fontFamily: "Prompt_400Regular",
    fontSize: 11,
    color: C.muted,
  },

  modalAmountVal: {
    fontFamily: "Prompt_700Bold",
    fontSize: 20,
    color: C.pinkDark,
    letterSpacing: -0.5,
  },

  qrDisplayCard: {
    width: 220,
    height: 220,
    borderRadius: 16,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#F3EFF1",
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
    overflow: "hidden",
  },

  qrLargeImage: {
    width: 204,
    height: 204,
    borderRadius: 12,
  },

  noQrInsideModal: {
    alignItems: "center",
    padding: 16,
  },

  noQrInsideModalText: {
    fontFamily: "Prompt_400Regular",
    fontSize: 12,
    color: C.muted,
    textAlign: "center",
    marginVertical: 10,
  },

  modalSetupQrBtn: {
    backgroundColor: C.pinkLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },

  modalSetupQrBtnText: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 11,
    color: C.pinkDark,
  },

  qrMetaCard: {
    width: "100%",
    backgroundColor: "#FAF7F8",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: C.borderLight,
    marginBottom: 8,
  },

  qrMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 2,
  },

  qrMetaLabel: {
    fontFamily: "Prompt_400Regular",
    fontSize: 11,
    color: C.muted,
  },

  qrMetaValue: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 12,
    color: C.text,
  },

  copyMiniBtn: {
    padding: 4,
    marginLeft: 6,
  },

  qrScanTipText: {
    fontFamily: "Prompt_400Regular",
    fontSize: 10,
    color: C.muted,
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 10,
  },

  modalBtnPrimary: {
    backgroundColor: C.pink,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  modalBtnPrimaryText: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 13,
    color: C.white,
  },

  modalBtnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.pinkLight,
    borderRadius: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#F7D1DA",
  },

  modalBtnSecondaryText: {
    fontFamily: "Prompt_500Medium",
    fontSize: 13,
    color: C.pinkDark,
    marginLeft: 4,
  },

  // QR SETUP PICKER & DASHED BOX
  qrImagePickedBox: {
    alignItems: "center",
    backgroundColor: "#FAF7F8",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: C.borderLight,
    marginBottom: 12,
  },

  qrImagePickedPreview: {
    width: 150,
    height: 150,
    borderRadius: 10,
    backgroundColor: C.white,
  },

  qrImagePickedActions: {
    flexDirection: "row",
    marginTop: 10,
    gap: 8,
  },

  qrImagePickAgainBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
  },

  qrImagePickAgainText: {
    fontFamily: "Prompt_500Medium",
    fontSize: 11,
    color: C.text,
    marginLeft: 4,
  },

  qrUploadDashedBox: {
    backgroundColor: "#FAF7F8",
    borderWidth: 1.5,
    borderColor: "#F3C5CD",
    borderStyle: "dashed",
    borderRadius: 14,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  qrUploadDashedInner: {
    alignItems: "center",
  },

  qrUploadDashedTitle: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 12,
    color: C.pinkDark,
    marginTop: 6,
  },

  qrUploadDashedDesc: {
    fontFamily: "Prompt_400Regular",
    fontSize: 10,
    color: C.muted,
    marginTop: 2,
  },

  // PROFILE QR SECTION
  profileQrCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 2,
  },

  profileQrHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  profileQrIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.pinkLight,
    alignItems: "center",
    justifyContent: "center",
  },

  profileQrTitle: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 14,
    color: C.text,
  },

  profileQrDesc: {
    fontFamily: "Prompt_400Regular",
    fontSize: 10,
    color: C.textMuted,
    marginTop: 1,
  },

  userQrPreviewBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAF7F8",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.borderLight,
  },

  userQrThumbWrap: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: C.white,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
  },

  userQrThumb: {
    width: "100%",
    height: "100%",
  },

  userQrPromptpayText: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 12,
    color: C.text,
  },

  userQrBankText: {
    fontFamily: "Prompt_400Regular",
    fontSize: 11,
    color: C.textMuted,
    marginTop: 1,
  },

  userQrActionsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
  },

  userQrActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.borderLight,
  },

  userQrActionText: {
    fontFamily: "Prompt_500Medium",
    fontSize: 10,
    color: C.pinkDark,
    marginLeft: 3,
  },

  noQrPromptBox: {
    backgroundColor: "#FAF7F8",
    borderWidth: 1.5,
    borderColor: "#F3C5CD",
    borderStyle: "dashed",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  noQrDashedInner: {
    alignItems: "center",
  },

  noQrTitle: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 12,
    color: C.pinkDark,
    marginTop: 4,
  },

  noQrSubtitle: {
    fontFamily: "Prompt_400Regular",
    fontSize: 10,
    color: C.muted,
    marginTop: 2,
    textAlign: "center",
  },
});

