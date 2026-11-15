
import React, { useState, useEffect, useRef, useCallback } from "react";

import {
  View,
  Text as NativeText,
  TextInput as NativeTextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Pressable,
  Image,
  Keyboard,
  Modal,
  ActivityIndicator,
  AppState,
  BackHandler,
  useWindowDimensions,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";
import * as Brightness from "expo-brightness";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import NetInfo from "@react-native-community/netinfo";

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
  pink: "#F06459",
  pinkDark: "#D94D43",
  pinkLight: "#FDE8E1",
  pinkBg: "#FDF5F0",
  white: "#FFFFFF",
  text: "#201317",
  textMuted: "#736067",
  muted: "#85707A",
  border: "#EFE3E6",
  borderLight: "#F8EFF1",
  red: "#DC2626",
  redLight: "#FEE2E2",
  amber: "#D97706",
  amberLight: "#FEF3C7",
  surface: "#FAF7F8",
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

const R = { sm: 12, md: 16, lg: 24 };
const SP = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

const baht = (n) => "฿" + Number(n || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CATEGORIES = [
  { id: "food", label: "อาหาร", icon: "restaurant-outline", color: "#D97706", bg: "#FEF3C7" },
  { id: "transport", label: "เดินทาง", icon: "car-outline", color: "#3884E8", bg: "#EDF4FE" },
  { id: "stay", label: "ที่พัก", icon: "bed-outline", color: "#7651B5", bg: "#F1EAFE" },
  { id: "activity", label: "กิจกรรม", icon: "ticket-outline", color: "#1B9962", bg: "#E8F8F0" },
  { id: "shopping", label: "ช้อปปิ้ง", icon: "bag-handle-outline", color: "#D94D43", bg: "#FDE8E1" },
  { id: "other", label: "อื่น ๆ", icon: "ellipsis-horizontal-circle-outline", color: "#85707A", bg: "#FAF7F8" },
];

const getCategory = (categoryId) =>
  CATEGORIES.find((category) => category.id === categoryId) ||
  CATEGORIES.find((category) => category.id === "other");

function friendlyError(error) {
  const message = String(error?.message || error || "").trim();
  const normalized = message.toLowerCase();
  if (!message) return "ทำรายการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
  if (normalized.includes("invalid login credentials")) return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
  if (normalized.includes("email not confirmed")) return "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ";
  if (normalized.includes("user already registered")) return "อีเมลนี้สมัครสมาชิกไว้แล้ว";
  if (normalized.includes("rate limit") || normalized.includes("over_email_send_rate_limit")) {
    return "ดำเนินการถี่เกินไป กรุณารอสักครู่แล้วลองใหม่";
  }
  if (normalized.includes("network") || normalized.includes("fetch")) {
    return "เชื่อมต่ออินเทอร์เน็ตไม่ได้ กรุณาตรวจสอบเครือข่ายแล้วลองใหม่";
  }
  if (normalized.includes("permission") || normalized.includes("row-level security")) {
    return "ไม่มีสิทธิ์ทำรายการนี้ กรุณาตรวจสอบบัญชีหรือสิทธิ์สมาชิก";
  }
  if (normalized.includes("duplicate key") || normalized.includes("already exists")) {
    return "ข้อมูลนี้มีอยู่แล้ว กรุณาตรวจสอบข้อมูลแล้วลองใหม่";
  }
  return message;
}

// ==========================================
// 3. REUSABLE COMPONENTS
// ==========================================

function Text({ style, ...props }) {
  const resolvedStyle = StyleSheet.flatten(style) || {};
  const fontSize = resolvedStyle.fontSize || 14;
  return (
    <NativeText
      {...props}
      style={[
        { lineHeight: Math.ceil(fontSize * 1.65), paddingVertical: 1 },
        style,
      ]}
    />
  );
}

function TextInput({ style, inputRef, ...props }) {
  return (
    <NativeTextInput
      ref={inputRef}
      {...props}
      style={[
        { lineHeight: 24, paddingVertical: 8 },
        style,
      ]}
    />
  );
}

function Avatar({ name = "", uri, size = 40 }) {
  const initial = String(name).trim().charAt(0).toUpperCase() || "?";
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: C.pinkLight,
        borderWidth: 1,
        borderColor: C.border,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="cover" />
      ) : (
        <Text style={{ color: C.pinkDark, fontFamily: "Prompt_600SemiBold", fontSize: Math.max(11, size * 0.38) }}>
          {initial}
        </Text>
      )}
    </View>
  );
}

function Button({
  title,
  onPress,
  outline = false,
  style,
  disabled = false,
  icon,
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, {
    toValue: 0.97,
    useNativeDriver: true,
    speed: 28,
    bounciness: 5,
  }).start();
  const pressOut = () => Animated.spring(scale, {
    toValue: 1,
    useNativeDriver: true,
    speed: 24,
    bounciness: 8,
  }).start();
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
    <TouchableOpacity
      activeOpacity={0.9}
      disabled={disabled}
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
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
    </Animated.View>
  );
}

function Toast({ toast, onDismiss }) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return undefined;
    translateY.setValue(-100);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 20,
        bounciness: 5,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) onDismiss(toast.id);
      });
    }, 2200);

    return () => clearTimeout(timer);
  }, [toast, translateY, opacity, onDismiss]);

  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: SP.md,
        left: SP.lg,
        right: SP.lg,
        zIndex: 10000,
        elevation: 20,
        minHeight: 48,
        borderRadius: R.md,
        paddingHorizontal: SP.lg,
        paddingVertical: SP.sm,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: isError ? C.redLight : C.greenLight,
        opacity,
        transform: [{ translateY }],
        shadowColor: C.shadowMedium,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      }}
    >
      <Ionicons
        name={isError ? "alert-circle" : "checkmark-circle"}
        size={20}
        color={isError ? C.red : C.green}
        style={{ marginRight: SP.sm }}
      />
      <Text style={{ flex: 1, color: C.text, fontSize: 13 }}>
        {toast.message}
      </Text>
    </Animated.View>
  );
}

function OfflineBanner({ visible }) {
  const translateY = useRef(new Animated.Value(-28)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: visible ? 0 : -28,
        useNativeDriver: true,
        speed: 24,
        bounciness: 2,
      }),
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, translateY, opacity]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 28,
        zIndex: 10001,
        elevation: 21,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: C.text,
        opacity,
        transform: [{ translateY }],
      }}
    >
      <Text style={{ color: C.white, fontFamily: "Prompt_500Medium", fontSize: 11, lineHeight: 18 }}>
        ออฟไลน์ - ข้อมูลอาจไม่เป็นปัจจุบัน
      </Text>
    </Animated.View>
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
  autoCapitalize,
  inputRef,
  autoFocus,
  returnKeyType,
  onSubmitEditing,
  error,
  maxLength,
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
          inputRef={inputRef}
          autoFocus={autoFocus}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          maxLength={maxLength}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={
            autoCapitalize !== undefined
              ? autoCapitalize
              : keyboardType === "email-address"
              ? "none"
              : secureTextEntry
              ? "none"
              : "sentences"
          }
          autoCorrect={false}
        />
      </View>
      {!!error && <Text style={s.inputErrorText}>{error}</Text>}
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
  const float = useRef(new Animated.Value(0)).current;
  const tilt = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(1)).current;
  const [messageIndex, setMessageIndex] = useState(-1);
  const messages = [
    "เป็ดเตือนแล้วนะ… ใครยังไม่โอนเอ่ย? 🦆",
    "ทริปสนุก บิลอย่าค้างน้า 😄",
    "โอนแล้วสะกิดเป็ดด้วยนะ!",
  ];

  useEffect(() => {
    const floating = Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: 1, duration: 1500, useNativeDriver: true }),
      Animated.timing(float, { toValue: 0, duration: 1500, useNativeDriver: true }),
    ]));
    const swaying = Animated.loop(Animated.sequence([
      Animated.timing(tilt, { toValue: 1, duration: 1800, useNativeDriver: true }),
      Animated.timing(tilt, { toValue: -1, duration: 1800, useNativeDriver: true }),
      Animated.timing(tilt, { toValue: 0, duration: 1800, useNativeDriver: true }),
    ]));
    floating.start();
    swaying.start();
    return () => {
      floating.stop();
      swaying.stop();
    };
  }, [float, tilt]);

  const bounceDuck = () => {
    setMessageIndex((current) => (current + 1) % messages.length);
    bounce.setValue(0.82);
    Animated.spring(bounce, {
      toValue: 1,
      useNativeDriver: true,
      speed: 18,
      bounciness: 12,
    }).start();
  };
  const rotate = tilt.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-4deg", "0deg", "4deg"],
  });
  return (
    <Pressable onPress={bounceDuck} accessibilityRole="button" accessibilityLabel="แตะน้องเป็ด">
      <Animated.View
        style={[
          style,
          {
            transform: [
              { translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -7] }) },
              { rotate },
              { scale: bounce },
            ],
          },
        ]}
      >
        <Image
          source={require("./assets/Duck.png")}
          style={{ width: "100%", height: "100%" }}
          resizeMode="contain"
        />
      </Animated.View>
      {messageIndex >= 0 && (
        <View style={s.duckSpeech}>
          <Text style={s.duckSpeechText}>{messages[messageIndex]}</Text>
        </View>
      )}
    </Pressable>
  );
}

function AmbientBackground() {
  const drift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(drift, { toValue: 1, duration: 9000, useNativeDriver: true }),
      Animated.timing(drift, { toValue: 0, duration: 9000, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [drift]);
  const translate = drift.interpolate({ inputRange: [0, 1], outputRange: [-18, 24] });
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[s.ambientOrb, s.ambientOrbPeach, { transform: [{ translateX: translate }, { translateY: translate }] }]} />
      <Animated.View style={[s.ambientOrb, s.ambientOrbCoral, { transform: [{ translateX: Animated.multiply(translate, -0.65) }] }]} />
    </View>
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

function decodeBase64(value) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const clean = value.replace(/^data:[^,]*;base64,/, "").replace(/[^A-Za-z0-9+/=]/g, "");
  const bytes = new Uint8Array(Math.floor((clean.length * 3) / 4) - (clean.endsWith("==") ? 2 : clean.endsWith("=") ? 1 : 0));
  let outputIndex = 0;
  for (let index = 0; index < clean.length; index += 4) {
    const a = alphabet.indexOf(clean[index]);
    const b = alphabet.indexOf(clean[index + 1]);
    const c = alphabet.indexOf(clean[index + 2]);
    const d = alphabet.indexOf(clean[index + 3]);
    const block = (a << 18) | (b << 12) | ((c < 0 ? 0 : c) << 6) | (d < 0 ? 0 : d);
    if (outputIndex < bytes.length) bytes[outputIndex++] = (block >> 16) & 255;
    if (outputIndex < bytes.length) bytes[outputIndex++] = (block >> 8) & 255;
    if (outputIndex < bytes.length) bytes[outputIndex++] = block & 255;
  }
  return bytes.buffer;
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
  const { width: windowWidth } = useWindowDimensions();

  // ----------------------------------------
  // SCREEN
  // ----------------------------------------

  const [screen, setScreen] = useState("landing");
  const [tab, setTab] = useState("home");
  const [onboardingPage, setOnboardingPage] = useState(0);
  const [isOffline, setIsOffline] = useState(false);

  // ----------------------------------------
  // USER
  // ----------------------------------------

  const [userId, setUserId] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [phone, setPhone] = useState("");
  const [currency, setCurrency] = useState("THB");

  // ----------------------------------------
  // APPLICATION
  // ----------------------------------------

  const [busy, setBusy] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [notice, setNotice] = useState(null);
  const [toast, setToast] = useState(null);
  const [notificationRows, setNotificationRows] = useState([]);
  const [notificationModal, setNotificationModal] = useState(false);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState("");
  const [profileCoverUrl, setProfileCoverUrl] = useState("");
  const [groupCoverUrl, setGroupCoverUrl] = useState("");
  const [tripCoverUrl, setTripCoverUrl] = useState("");
  const [profileModal, setProfileModal] = useState(false);

  // ----------------------------------------
  // GROUPS
  // ----------------------------------------

  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [groupExpenses, setGroupExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);

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
  const [expenseCategory, setExpenseCategory] = useState("other");
  const [expenseError, setExpenseError] = useState("");
  const [expenseTripId, setExpenseTripId] = useState(null);
  const [expensePayer, setExpensePayer] = useState(null);
  const [expenseParticipants, setExpenseParticipants] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [tripExpenses, setTripExpenses] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [detailTab, setDetailTab] = useState("expenses"); // "expenses" | "settlement"
  const [memberNicknames, setMemberNicknames] = useState({});
  const [editingMember, setEditingMember] = useState(null);
  const [editingNickInput, setEditingNickInput] = useState("");

  // Sub-items & Itemized Food expense states
  const [splitMode, setSplitMode] = useState("equal"); // "equal" | "itemized"
  const [expenseItems, setExpenseItems] = useState([]); // [{ id, name, amount, participants }]
  const [expandedExpenses, setExpandedExpenses] = useState({}); // { [expId]: boolean }
  const expenseAmountInputRef = useRef(null);
  const expenseTitleInputRef = useRef(null);

  // QR Code & Payment states
  const [userQrData, setUserQrData] = useState(null); // { promptpay, bankName, accountName, qrUri, base64 }
  const [memberQrMap, setMemberQrMap] = useState({}); // { [userId]: { promptpay, bankName, accountName, qrUri, base64 } }
  const [viewingQrModal, setViewingQrModal] = useState(null); // { userId, name, amount, promptpay, bankName, accountName, qrUri }
  const qrBrightnessBeforeOpen = useRef(null);
  const onboardingScrollRef = useRef(null);
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
      showAlert(
        "Supabase Error",
        "กรุณาตรวจสอบ Supabase URL และ Publishable Key"
      );

      return false;
    }

    return true;
  };

  const showAlert = (title, message, actions) => {
    setNotice({
      title: title || "TripBuddies",
      message: String(message || ""),
      actions: Array.isArray(actions) ? actions : null,
    });
  };

  const showToast = (message, type = "success") => {
    setToast({ id: Date.now() + Math.random(), message: String(message || ""), type });
  };

  const dismissToast = useCallback((id) => {
    setToast((current) => current?.id === id ? null : current);
  }, []);

  const persistProfile = async (profile) => {
    const { error } = await supabase.from("profiles").upsert(profile);
    if (error) throw error;
  };

  const saveOwnProfile = async (fields = {}) => {
    if (!userId) throw new Error("กรุณาเข้าสู่ระบบก่อนบันทึกโปรไฟล์");
    await persistProfile({
      id: userId,
      full_name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      currency: currency.includes("USD") ? "USD" : "THB",
      avatar_url: profileAvatarUrl || null,
      cover_url: profileCoverUrl || null,
      qr_code_url: userQrData?.qrUri || null,
      ...fields,
    });
  };

  const uploadImageAsset = async (asset, category) => {
    let body;
    if (asset.file && typeof asset.file.arrayBuffer === "function") {
      body = asset.file;
    } else if (asset.base64) {
      body = decodeBase64(asset.base64);
    } else {
      const response = await fetch(asset.uri);
      if (!response.ok) throw new Error("อ่านไฟล์รูปภาพไม่สำเร็จ");
      body = await response.arrayBuffer();
    }
    const bodyLength = body?.byteLength ?? body?.size;
    if (!body || !bodyLength) {
      throw new Error("ไฟล์รูปภาพว่าง กรุณาเลือกรูปใหม่");
    }
    const extension = (asset.mimeType || "image/jpeg").split("/")[1] || "jpg";
    const objectPath = `${userId}/${category}/${Date.now()}-${Math.floor(Math.random() * 100000)}.${extension}`;
    const { error } = await supabase.storage
      .from("images")
      .upload(objectPath, body, {
        contentType: asset.mimeType || "image/jpeg",
        upsert: true,
      });
    if (error) throw error;
    const { data } = supabase.storage.from("images").getPublicUrl(objectPath);
    return data.publicUrl;
  };

  const pickAndUploadImage = async (category) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        showAlert("ต้องอนุญาตเข้าถึงรูปภาพ", "อนุญาตให้ TripBuddies เข้าถึงคลังรูปภาพเพื่ออัปโหลดรูป");
        return;
      }
      const selection = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: category !== "qr",
        quality: 0.85,
        base64: true,
      });
      if (selection.canceled || !selection.assets?.[0]) return;

      setBusy(true);
      const url = await uploadImageAsset(selection.assets[0], category);
      if (category === "avatar") {
        await saveOwnProfile({ avatar_url: url });
        setProfileAvatarUrl(url);
      } else if (category === "profile-cover") {
        await saveOwnProfile({ cover_url: url });
        setProfileCoverUrl(url);
      } else if (category === "group-cover") {
        setGroupCoverUrl(url);
      } else if (category === "trip-cover") {
        setTripCoverUrl(url);
      } else if (category === "qr") {
        setQrImageUri(url);
        setQrImageBase64("");
      }
      showToast("บันทึกรูปภาพขึ้นคลัง TripBuddies แล้ว");
    } catch (error) {
      showAlert("อัปโหลดรูปไม่สำเร็จ", friendlyError(error));
    } finally {
      setBusy(false);
    }
  };

  const noticeSheet = () => (
    <>
      <OfflineBanner visible={isOffline} />
      <Modal
        visible={!!notice}
        transparent
        animationType="slide"
        onRequestClose={() => setNotice(null)}
      >
        <Pressable style={s.sheetOverlay} onPress={() => setNotice(null)}>
          <Pressable style={s.bottomSheet} onPress={() => {}}>
            <View style={s.sheetHandle} />
            <Text style={s.modalTitle}>{notice?.title}</Text>
            <Text style={s.modalSubtitle}>{notice?.message}</Text>
            {(notice?.actions || [{ text: "ตกลง" }]).map((action, index) => (
              <Button
                key={`${action.text}-${index}`}
                title={action.text}
                outline={action.style === "cancel"}
                onPress={() => {
                  setNotice(null);
                  if (action.onPress) action.onPress();
                }}
                style={index > 0 ? { marginTop: 8 } : null}
              />
            ))}
          </Pressable>
        </Pressable>
      </Modal>
      <Modal visible={busy} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={s.loadingOverlay}>
          <View style={s.loadingCard}>
            <Duck style={{ width: 116, height: 116 }} />
            <ActivityIndicator size="small" color={C.pinkDark} />
            <Text style={s.loadingText}>กำลังบันทึกข้อมูล...</Text>
          </View>
        </View>
      </Modal>
      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );

  // ========================================
  // 6. LOAD TRIPS
  // ========================================

  const loadTrips = async (uid, groupId) => {
    if (!uid || !groupId) {
      setTrips([]);
      setTotalBudget(0);
      setTotalSpent(0);
      return [];
    }

    const { data, error } = await supabase
      .from("trips")
      .select("id, group_id, name, cover_url, created_by")
      .eq("group_id", groupId)
      .order("name", { ascending: true });

    if (error) {
      console.log("Load trips error:", error.message);

      showAlert(
        "โหลดทริปไม่สำเร็จ",
        friendlyError(error)
      );

      return [];
    }

    const tripList = (data || []).map((trip) => ({
      ...trip,
      title: trip.name,
      destination: "",
      budget: 0,
    }));

    setTrips(tripList);

    const budget = tripList.reduce(
      (sum, trip) =>
        sum + Number(trip.budget || 0),
      0
    );

    setTotalBudget(budget);

    if (tripList.length === 0) {
      setTotalSpent(0);
      return tripList;
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
      showAlert("โหลดสรุปค่าใช้จ่ายไม่สำเร็จ", friendlyError(expenseError));
      return tripList;
    }

    const spent = (expenses || []).reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );

    setTotalSpent(spent);
    return tripList;
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

      showAlert(
        "โหลดกลุ่มไม่สำเร็จ",
        friendlyError(error)
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
      setGroupExpenses([]);
      setSettlements([]);

      return [];
    }

    const { data: groupData, error: groupError } =
      await supabase
        .from("groups")
        .select("id, name, invite_code, cover_url, created_by")
        .in("id", groupIds)
        .order("name", { ascending: true });

    if (groupError) {
      console.log(
        "Load groups error:",
        groupError.message
      );

      showAlert(
        "โหลดข้อมูลกลุ่มไม่สำเร็จ",
        friendlyError(groupError)
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
      return [];
    }

    const { data, error } = await supabase
      .from("group_members")
      .select("id, group_id, user_id, role")
      .eq("group_id", groupId);

    if (error) {
      showAlert(
        "โหลดสมาชิกไม่สำเร็จ",
        friendlyError(error)
      );

      return [];
    }

    const userIds = (data || []).map(
      (item) => item.user_id
    );

    if (userIds.length === 0) {
      setMembers([]);
      return [];
    }

    const { data: profiles, error: profileError } =
      await supabase
        .from("profiles")
        .select("id, full_name, email, phone, avatar_url, cover_url, qr_code_url, currency")
        .in("id", userIds);

    if (profileError) {
      showAlert("โหลดโปรไฟล์สมาชิกไม่สำเร็จ", friendlyError(profileError));
    }

    if (profiles && profiles.length > 0) {
      setMemberQrMap((prev) => {
        const next = { ...prev };
        profiles.forEach((p) => {
          next[p.id] = {
              promptpay: p.phone || "",
            accountName: p.full_name || "",
              qrUri: p.qr_code_url || "",
            base64: "",
          };
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
    return result;
  };

  // ========================================
  // 9. SELECT GROUP
  // ========================================

  const selectGroup = async (group) => {
    if (!group) return;

    setActiveGroup(group);

    const loadedMembers = await loadMembers(group.id);
    const loadedTrips = await loadTrips(userId, group.id);
    try {
      await loadGroupExpenses(group.id);
      await loadSettlements(group.id);
    } catch (error) {
      setGroupExpenses([]);
      setSettlements([]);
      showAlert("โหลดสรุปยอดกลุ่มไม่สำเร็จ", friendlyError(error));
    }
    if (expenseModal) {
      setExpenseParticipants((loadedMembers || []).map((member) => member.user_id));
      setExpensePayer(userId);
      setExpenseTripId(loadedTrips?.[0]?.id || null);
    }
    return loadedTrips || [];
  };

  // ========================================
  // 10. CREATE GROUP
  // ========================================

  const createGroup = async () => {
    if (!groupName.trim()) {
      showAlert(
        "ข้อมูลไม่ครบ",
        "กรุณากรอกชื่อกลุ่ม"
      );

      return;
    }

    setGroupActionBusy(true);

    try {
      const previousGroupIds = new Set(groups.map((group) => group.id));
      const { data, error } = await supabase.rpc(
        "create_group",
        {
          p_name: groupName.trim(),
          p_cover_url: groupCoverUrl || null,
        }
      );

      if (error) throw error;

      const loadedGroups = await loadGroups(userId);

      const newGroup = loadedGroups.find(
        (group) => group.id === (typeof data === "string" ? data : data?.id)
      ) || loadedGroups.find((group) => !previousGroupIds.has(group.id));

      if (!newGroup) throw new Error("สร้างกลุ่มแล้วแต่โหลดกลุ่มใหม่ไม่พบ");
      await selectGroup(newGroup);

      setGroupName("");
      setGroupCoverUrl("");
      setGroupModal(false);

      showToast("สร้างกลุ่มเรียบร้อยแล้ว");
    } catch (error) {
      showAlert(
        "สร้างกลุ่มไม่สำเร็จ",
        friendlyError(error)
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
      showAlert(
        "ข้อมูลไม่ครบ",
        "กรุณากรอกรหัสเชิญ"
      );

      return;
    }

    setGroupActionBusy(true);

    try {
      const inviteCode = joinCode.trim().toUpperCase();
      const { data, error } = await supabase.rpc(
        "join_group_by_code",
        {
          p_code: inviteCode,
        }
      );

      if (error) throw error;

      const loadedGroups = await loadGroups(userId);

      const joinedGroup = loadedGroups.find(
        (group) => group.id === (typeof data === "string" ? data : data?.id)
      ) || loadedGroups.find(
        (group) => String(group.invite_code).toUpperCase() === inviteCode.toUpperCase()
      );

      if (!joinedGroup) throw new Error("เข้าร่วมกลุ่มแล้วแต่โหลดข้อมูลกลุ่มไม่พบ");
      await selectGroup(joinedGroup);

      setJoinCode("");

      showToast("เข้าร่วมกลุ่มเรียบร้อยแล้ว");
    } catch (error) {
      showAlert(
        "เข้าร่วมกลุ่มไม่สำเร็จ",
        friendlyError(error)
      );
    } finally {
      setGroupActionBusy(false);
    }
  };

  const copyInviteCode = async () => {
    if (!activeGroup?.invite_code) return;
    try {
      await Clipboard.setStringAsync(String(activeGroup.invite_code));
      showToast("คัดลอกรหัสกลุ่มสำเร็จ!");
    } catch (error) {
      showAlert("คัดลอกรหัสไม่สำเร็จ", friendlyError(error));
    }
  };

  const confirmGroupExit = () => {
    if (!activeGroup) return;
    const isCreator = activeGroup.created_by === userId || activeGroup.role === "owner";
    showAlert(
      isCreator ? "ลบกลุ่มนี้หรือไม่?" : "ออกจากกลุ่มนี้หรือไม่?",
      isCreator
        ? "การลบกลุ่มจะนำกลุ่มและข้อมูลที่เกี่ยวข้องออกตามกติกาความปลอดภัยของระบบ"
        : "คุณสามารถเข้าร่วมกลุ่มอีกครั้งด้วยรหัสเชิญ",
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: isCreator ? "ลบกลุ่ม" : "ออกจากกลุ่ม",
          onPress: async () => {
            setGroupActionBusy(true);
            try {
              const { error } = await supabase.rpc(
                isCreator ? "delete_group_safe" : "leave_group_safe",
                { p_group_id: activeGroup.id }
              );
              if (error) throw error;
              const updatedGroups = await loadGroups(userId);
              setActiveGroup(null);
              setMembers([]);
              setTrips([]);
              setGroupExpenses([]);
              if (updatedGroups.length) await selectGroup(updatedGroups[0]);
              showToast(isCreator ? "ลบกลุ่มเรียบร้อยแล้ว" : "ออกจากกลุ่มเรียบร้อยแล้ว");
            } catch (error) {
              showAlert(isCreator ? "ลบกลุ่มไม่สำเร็จ" : "ออกจากกลุ่มไม่สำเร็จ", friendlyError(error));
            } finally {
              setGroupActionBusy(false);
            }
          },
        },
      ]
    );
  };

  // ========================================
  // 12. ADD MEMBER BY EMAIL
  // ========================================

  const addMember = async () => {
    if (!activeGroup) {
      showAlert(
        "ยังไม่ได้เลือกกลุ่ม",
        "กรุณาเลือกกลุ่มก่อน"
      );

      return;
    }

    if (!memberEmail.trim()) {
      showAlert(
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

      showToast("เพิ่มสมาชิกเรียบร้อยแล้ว");
    } catch (error) {
      showAlert(
        "เพิ่มสมาชิกไม่สำเร็จ",
        friendlyError(error)
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
      .select("id, full_name, email, phone, avatar_url, cover_url, qr_code_url, currency")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      showAlert("โหลดโปรไฟล์ไม่สำเร็จ", friendlyError(error));
    }

    const resolvedName =
      data?.full_name ||
      user.user_metadata?.full_name ||
      name ||
      "";

    setName(resolvedName);
    setProfileAvatarUrl(data?.avatar_url || "");
    setProfileCoverUrl(data?.cover_url || "");
    const resolvedCurrency = data?.currency === "USD" ? "USD" : "THB";
    setCurrency(resolvedCurrency);

    if (!error) {
      try {
        await persistProfile({
          id: user.id,
          full_name: resolvedName,
          email: user.email || "",
          phone: data?.phone ?? user.user_metadata?.phone ?? "",
          avatar_url: data?.avatar_url || null,
          cover_url: data?.cover_url || null,
          qr_code_url: data?.qr_code_url || null,
          currency: resolvedCurrency,
        });
      } catch (err) {
        showAlert("บันทึกโปรไฟล์ไม่สำเร็จ", friendlyError(err));
      }
    }

    let localQrParsed = null;
    try {
      const localQr = await AsyncStorage.getItem(`@tb_user_qr_${user.id}`);
      if (localQr) {
        localQrParsed = JSON.parse(localQr);
        setMemberQrMap((prev) => ({ ...prev, [user.id]: localQrParsed }));
      }
    } catch {}

    const extractedPhone = data?.phone || "";
    let qr = data?.qr_code_url || extractedPhone
      ? {
          promptpay: extractedPhone,
          bankName: "",
          accountName: resolvedName,
          qrUri: data?.qr_code_url || "",
          base64: "",
        }
      : null;
    if (qr) {
      qr = {
        ...qr,
        bankName: localQrParsed?.bankName || "",
        accountName: qr.accountName || localQrParsed?.accountName || "",
      };
    }
    setUserQrData(qr);
    if (qr) {
      setMemberQrMap((prev) => ({ ...prev, [user.id]: qr }));
    } else {
      setMemberQrMap((prev) => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });
    }

    setPhone(extractedPhone);

    const loadedGroups = await loadGroups(user.id);

    if (loadedGroups.length > 0) {
      const firstGroup = loadedGroups[0];

      setActiveGroup(firstGroup);

      await loadMembers(firstGroup.id);
      await loadTrips(user.id, firstGroup.id);
      try {
        await loadGroupExpenses(firstGroup.id);
        await loadSettlements(firstGroup.id);
      } catch (expenseError) {
        setGroupExpenses([]);
        setSettlements([]);
        showAlert("โหลดสรุปยอดกลุ่มไม่สำเร็จ", friendlyError(expenseError));
      }
    } else {
      setActiveGroup(null);
      setMembers([]);
      setTrips([]);
      setTotalBudget(0);
      setTotalSpent(0);
      setGroupExpenses([]);
      setSettlements([]);
    }

    try {
      await loadNotifications(user.id);
    } catch (notificationError) {
      showAlert("โหลดการแจ้งเตือนไม่สำเร็จ", friendlyError(notificationError));
    }

    setTab("home");
    setScreen("home");
  };

  const showEntryScreen = async () => {
    try {
      const seen = await AsyncStorage.getItem("@tb_seen_onboarding");
      setScreen(seen === "1" ? "landing" : "onboarding");
    } catch (error) {
      showAlert("เปิดหน้าเริ่มต้นไม่สำเร็จ", friendlyError(error));
      setScreen("landing");
    }
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
        } else {
          await showEntryScreen();
        }
      } catch (error) {
        console.log(
          "Session error:",
          error.message
        );
        if (mounted) await showEntryScreen();
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
          setCurrency("บาท (THB)");
          setProfileAvatarUrl("");
          setProfileCoverUrl("");
          setUserQrData(null);
          setNotificationRows([]);
          setGroupExpenses([]);
          setSettlements([]);

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

  useEffect(() => NetInfo.addEventListener((state) => {
    setIsOffline(
      state.isConnected === false || state.isInternetReachable === false
    );
  }), []);

  useEffect(() => {
    if (!viewingQrModal) return undefined;
    let active = true;

    const brightenForQr = async () => {
      try {
        const previousBrightness = await Brightness.getBrightnessAsync();
        if (!active) return;
        qrBrightnessBeforeOpen.current = previousBrightness;
        await Brightness.setBrightnessAsync(1);
        if (!active) {
          await Brightness.setBrightnessAsync(previousBrightness);
          qrBrightnessBeforeOpen.current = null;
        }
      } catch {}
    };

    brightenForQr();
    return () => {
      active = false;
      const previousBrightness = qrBrightnessBeforeOpen.current;
      qrBrightnessBeforeOpen.current = null;
      if (previousBrightness !== null) {
        Brightness.setBrightnessAsync(previousBrightness).catch(() => {});
      }
    };
  }, [!!viewingQrModal]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (screen === "tripDetail") { nav("groups"); return true; }
      if (screen === "register") { setScreen("welcome"); return true; }
      if (screen === "welcome") { showEntryScreen(); return true; }
      if (["groups", "profile"].includes(screen)) { goHome(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [screen]);

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
      showEntryScreen();
    }
  };

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const handleEmailChange = (value) => {
    setEmail(value);
    setEmailError(
      value.trim() && !isValidEmail(value)
        ? "กรุณากรอกอีเมลให้ถูกต้อง"
        : ""
    );
  };

  const validateEmail = () => {
    if (!isValidEmail(email)) {
      setEmailError("กรุณากรอกอีเมลให้ถูกต้อง");
      return false;
    }
    setEmailError("");
    return true;
  };

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem("@tb_seen_onboarding", "1");
      setOnboardingPage(0);
      setScreen("landing");
    } catch (error) {
      showAlert("บันทึกการตั้งค่าไม่สำเร็จ", friendlyError(error));
    }
  };

  const continueOnboarding = () => {
    if (onboardingPage >= 2) {
      finishOnboarding();
      return;
    }
    const nextPage = onboardingPage + 1;
    onboardingScrollRef.current?.scrollTo({ x: nextPage * windowWidth, animated: true });
    setOnboardingPage(nextPage);
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
    if (!validateEmail()) return;

    if (!password) {
      showAlert(
        "ข้อมูลไม่ครบ",
        "กรุณากรอกรหัสผ่าน"
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
      showAlert(
        "เข้าสู่ระบบไม่สำเร็จ",
        friendlyError(error)
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
    if (!validateEmail()) return;

    if (
      !name.trim() ||
      !password ||
      !confirm
    ) {
      showAlert(
        "ข้อมูลไม่ครบ",
        "กรุณากรอกข้อมูลให้ครบทุกช่อง"
      );

      return;
    }

    if (password.length < 6) {
      showAlert(
        "รหัสผ่านสั้นเกินไป",
        "กรุณาใช้รหัสผ่านอย่างน้อย 6 ตัวอักษร"
      );

      return;
    }

    if (password !== confirm) {
      showAlert(
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
        await loadUserData(data.user);
      } else {
        // Try to auto-login immediately without requiring email verification
        const autoLogin = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (autoLogin.data?.session && autoLogin.data?.user) {
          await loadUserData(autoLogin.data.user);
        } else {
          if (data.user) {
            try {
              await persistProfile({
                id: data.user.id,
                full_name: name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                currency: currency.includes("USD") ? "USD" : "THB",
                avatar_url: null,
                cover_url: null,
                qr_code_url: null,
              });
            } catch (profileError) {
              showAlert("สร้างบัญชีแล้ว แต่บันทึกโปรไฟล์ไม่สำเร็จ", friendlyError(profileError));
              return;
            }
          }

          showAlert(
            "สมัครสมาชิกสำเร็จ",
            "สร้างบัญชีแล้ว กรุณาตรวจสอบอีเมลเพื่อยืนยันก่อนเข้าสู่ระบบ",
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

        showAlert(
          "ระบบกำลังยุ่ง",
          "สมัครสมาชิกถี่เกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง"
        );
      } else {
        showAlert(
          "สมัครสมาชิกไม่สำเร็จ",
          friendlyError(error)
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
      showAlert(
        "ออกจากระบบไม่สำเร็จ",
        friendlyError(error)
      );

      return;
    }

    setScreen("welcome");
    setTab("home");
  };

  const saveProfileData = async () => {
    if (!name.trim()) {
      showAlert("ข้อมูลไม่ครบ", "กรุณากรอกชื่อของคุณ");
      return;
    }
    setBusy(true);
    try {
      await saveOwnProfile();
      setProfileModal(false);
      showToast("บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว");
    } catch (error) {
      showAlert("บันทึกโปรไฟล์ไม่สำเร็จ", friendlyError(error));
    } finally {
      setBusy(false);
    }
  };

  // ========================================
  // 20. CREATE TRIP
  // ========================================

  const createTrip = () => {
    if (!userId) {
      showAlert(
        "กรุณาเข้าสู่ระบบ",
        "ต้องเข้าสู่ระบบก่อนสร้างทริป"
      );

      return;
    }

    if (!activeGroup) {
      showAlert(
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
    setTripCoverUrl("");

    setTripModal(true);
  };

  // ========================================
  // 21. SAVE TRIP
  // ========================================

  const saveTrip = async () => {
    if (!activeGroup) {
      showAlert(
        "ไม่พบกลุ่ม",
        "กรุณาเลือกกลุ่มก่อนสร้างทริป"
      );

      return;
    }

    if (!tripTitle.trim()) {
      showAlert(
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
          name: tripTitle.trim(),
          cover_url: tripCoverUrl || null,
          created_by: userId,
          group_id: activeGroup.id,
        });

      if (error) throw error;

      setTripModal(false);
      setTripCoverUrl("");

      await loadTrips(userId, activeGroup.id);
      await loadGroupExpenses(activeGroup.id);
      await loadSettlements(activeGroup.id);

      showToast("บันทึกทริปลงในกลุ่มเรียบร้อยแล้ว");
    } catch (error) {
      showAlert(
        "สร้างทริปไม่สำเร็จ",
        friendlyError(error)
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
    return {
      ...exp,
      title: exp.title || "ค่าใช้จ่าย",
      participants: Array.isArray(exp.split_between) ? exp.split_between : [],
      splitType: Array.isArray(exp.items) && exp.items.length ? "itemized" : "equal",
      items: Array.isArray(exp.items) ? exp.items : [],
    };
  };

  const getMemberName = (mId) => {
    if (mId === userId) {
      return name ? `${name} (ฉัน)` : "ฉัน";
    }
    const found = members.find((m) => m.user_id === mId);
    return (
      memberNicknames[mId] ||
      found?.profile?.full_name ||
      (found?.role === "owner" ? "เจ้าของกลุ่ม 👑" : "เพื่อนในกลุ่ม")
    );
  };

  const saveMemberNickname = async (targetUserId, newName) => {
    if (!newName || !newName.trim()) return;
    const clean = newName.trim();
    if (targetUserId === userId) {
      try {
        await saveOwnProfile({ full_name: clean });
      } catch (error) {
        showAlert("บันทึกชื่อไม่สำเร็จ", friendlyError(error));
        return;
      }
    }
    const updated = {
      ...memberNicknames,
      [targetUserId]: clean,
    };
    setMemberNicknames(updated);
    try {
      await AsyncStorage.setItem("@tb_member_nicknames", JSON.stringify(updated));
    } catch (e) {
      showAlert("บันทึกชื่อเล่นในเครื่องไม่สำเร็จ", friendlyError(e));
      return;
    }

    setEditingMember(null);
    setEditingNickInput("");
    showToast(`ตั้งชื่อ "${clean}" เรียบร้อยแล้ว`);
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

  const pickQrImage = () => pickAndUploadImage("qr");

  const saveQrData = async () => {
    if (!qrSetupTarget) return;
    const tUid = qrSetupTarget.userId;
    const tName = qrSetupTarget.name;
    if (tUid !== userId) {
      showAlert("แก้ไขไม่ได้", "คุณสามารถแก้ไข QR Code ของโปรไฟล์ตัวเองเท่านั้น");
      return;
    }

    const cleanPromptPay = qrInputPromptPay.trim();
    if (!cleanPromptPay && !qrImageBase64 && !qrImageUri) {
      showAlert(
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
        base64: "",
        updatedAt: new Date().toISOString(),
      };

      const updatedMap = {
        ...memberQrMap,
        [tUid]: qrObj,
      };
      await saveOwnProfile({
        full_name: tName,
        phone: cleanPromptPay,
        qr_code_url: qrImageUri || null,
      });
      setMemberQrMap(updatedMap);
      setUserQrData(qrObj);
      setPhone(cleanPromptPay);
      try {
        await AsyncStorage.setItem(`@tb_user_qr_${tUid}`, JSON.stringify(qrObj));
        await AsyncStorage.setItem("@tb_member_qr_map", JSON.stringify(updatedMap));
      } catch (cacheError) {
        console.log("QR cache write failed:", cacheError.message);
      }

      setQrSetupModal(false);
      showToast(`บันทึกข้อมูล QR Code ของ ${tName} เรียบร้อยแล้ว`);
    } catch (err) {
      showAlert("บันทึกไม่สำเร็จ", friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const saveQrImageToDevice = async () => {
    if (!viewingQrModal?.qrUri) return;
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (permission.status !== "granted") {
        showAlert("ต้องอนุญาตเข้าถึงรูปภาพ", "อนุญาตให้ TripBuddies บันทึกรูป QR ลงในเครื่อง");
        return;
      }
      if (!FileSystem.cacheDirectory) {
        throw new Error("ไม่พบพื้นที่จัดเก็บชั่วคราวในเครื่อง");
      }
      const destination = `${FileSystem.cacheDirectory}tripbuddies-qr-${Date.now()}.png`;
      const download = await FileSystem.downloadAsync(viewingQrModal.qrUri, destination);
      if (download.status < 200 || download.status >= 300) {
        throw new Error("ดาวน์โหลดรูป QR ไม่สำเร็จ");
      }
      await MediaLibrary.saveToLibraryAsync(download.uri);
      showToast("บันทึกรูปแล้ว เปิดในแอปธนาคารเพื่อสแกนได้เลย");
    } catch (error) {
      showAlert("บันทึก QR ลงเครื่องไม่สำเร็จ", friendlyError(error));
    }
  };

  const removeQrData = async (targetUserId) => {
    const tUid = targetUserId || userId;
    if (tUid !== userId) {
      showAlert("ลบไม่ได้", "คุณสามารถลบ QR Code ของโปรไฟล์ตัวเองเท่านั้น");
      return;
    }
    showAlert("ยืนยัน", "ต้องการลบ QR Code และข้อมูลการรับเงินหรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ลบข้อมูล",
        style: "destructive",
        onPress: async () => {
          const updated = { ...memberQrMap };
          delete updated[tUid];
          try {
            await saveOwnProfile({
              phone: "",
              qr_code_url: null,
            });
          } catch (error) {
            showAlert("ลบข้อมูลไม่สำเร็จ", friendlyError(error));
            return;
          }
          setMemberQrMap(updated);
          setUserQrData(null);
          setPhone("");
          try {
            await AsyncStorage.removeItem(`@tb_user_qr_${tUid}`);
            await AsyncStorage.setItem("@tb_member_qr_map", JSON.stringify(updated));
          } catch (cacheError) {
            console.log("QR cache cleanup failed:", cacheError.message);
          }
          showToast("ลบข้อมูล QR Code เรียบร้อยแล้ว");
        },
      },
    ]);
  };

  // ----------------------------------------
  // SUB-ITEMS & FOOD EXPENSE HELPERS
  // ----------------------------------------

  const addExpenseSubItem = () => {
    setExpenseError("");
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
    setExpenseError("");
    if (expenseItems.length <= 1) {
      showAlert("แจ้งเตือน", "ต้องมีรายการอาหารอย่างน้อย 1 เมนู");
      return;
    }
    setExpenseItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const updateExpenseSubItem = (itemId, field, value) => {
    setExpenseError("");
    setExpenseItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, [field]: value } : item))
    );
  };

  const toggleSubItemParticipant = (itemId, pId) => {
    setExpenseError("");
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
    setExpenseError("");
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

  const calculateSettlement = (expensesList, membersList, payments = []) => {
    const net = {};
    const paidTotals = {};
    const owedTotals = {};

    membersList.forEach((m) => {
      net[m.user_id] = 0;
      paidTotals[m.user_id] = 0;
      owedTotals[m.user_id] = 0;
    });

    expensesList.forEach((exp) => {
      if (exp.is_settled) return;
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

    payments.forEach((p) => {
      const a = Number(p.amount) || 0;
      if (a <= 0) return;
      net[p.from_user] = (net[p.from_user] || 0) + a;
      net[p.to_user] = (net[p.to_user] || 0) - a;
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

  const loadGroupExpenses = async (groupId) => {
    if (!groupId) {
      setGroupExpenses([]);
      return;
    }
    const { data, error } = await supabase
      .from("expenses")
      .select("id, group_id, trip_id, title, amount, paid_by, split_between, slip_url, is_settled, created_at")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const expenseRows = data || [];
    const ids = expenseRows.map((expense) => expense.id);
    let items = [];
    if (ids.length) {
      const { data: itemRows, error: itemError } = await supabase
        .from("expense_items")
        .select("id, expense_id, name, amount, participants")
        .in("expense_id", ids);
      if (itemError) throw itemError;
      items = itemRows || [];
    }
    setGroupExpenses(expenseRows.map((expense) =>
      parseExpense({
        ...expense,
        items: items.filter((item) => item.expense_id === expense.id),
      })
    ));
  };

  const loadSettlements = async (groupId) => {
    if (!groupId) {
      setSettlements([]);
      return;
    }
    const { data, error } = await supabase
      .from("settlements")
      .select("id, group_id, trip_id, from_user, to_user, amount, created_at")
      .eq("group_id", groupId);
    if (error) throw error;
    setSettlements((data || []).map((r) => ({ ...r, amount: Number(r.amount) })));
  };

  const loadNotifications = async (uid) => {
    if (!uid) return;
    const { data, error } = await supabase
      .from("notifications")
      .select("id, user_id, title, message, type, is_read, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    if (error) throw error;
    setNotificationRows(data || []);
    return data || [];
  };

  const openNotifications = async () => {
    try {
      await loadNotifications(userId);
      setNotificationModal(true);
    } catch (error) {
      showAlert("โหลดการแจ้งเตือนไม่สำเร็จ", friendlyError(error));
    }
  };

  const closeNotifications = async () => {
    setNotificationModal(false);
    const unreadIds = notificationRows
      .filter((item) => !item.is_read)
      .map((item) => item.id);
    if (!userId || !unreadIds.length) return;

    try {
      const { data: updatedRows, error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", unreadIds)
        .eq("user_id", userId)
        .select("id");
      if (error) throw error;
      if (updatedRows?.length !== unreadIds.length) {
        throw new Error("อัปเดตสถานะอ่านแล้วไม่ครบ กรุณาตรวจสอบสิทธิ์ฐานข้อมูล");
      }
      setNotificationRows((current) =>
        current.map((item) => ({ ...item, is_read: true }))
      );
    } catch (error) {
      showAlert("อัปเดตการแจ้งเตือนไม่สำเร็จ", friendlyError(error));
    }
  };

  const loadTripExpenses = async (tripId) => {
    if (!tripId) return;
    setLoadingExpenses(true);
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("id, group_id, trip_id, title, amount, paid_by, split_between, slip_url, is_settled, created_at")
        .eq("trip_id", tripId)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      const expenseIds = (data || []).map((expense) => expense.id);
      let items = [];
      if (expenseIds.length) {
        const itemResult = await supabase
          .from("expense_items")
          .select("id, expense_id, name, amount, participants")
          .in("expense_id", expenseIds);
        if (itemResult.error) throw itemResult.error;
        items = itemResult.data || [];
      }
      const parsed = (data || []).map((expense) =>
        parseExpense({
          ...expense,
          items: items.filter((item) => item.expense_id === expense.id),
        })
      );
      setTripExpenses(parsed);
    } catch (err) {
      showAlert("โหลดรายการค่าใช้จ่ายไม่สำเร็จ", friendlyError(err));
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
        showAlert("ยังไม่ได้เลือกกลุ่ม", "กรุณาเลือกหรือสร้างกลุ่มก่อนบันทึกค่าใช้จ่าย", [
          { text: "ไปหน้ากลุ่ม", onPress: () => nav("groups") },
          { text: "ยกเลิก", style: "cancel" },
        ]);
      } else {
        showAlert("ยังไม่มีทริป", "กรุณาสร้างทริปแรกในกลุ่มก่อนบันทึกค่าใช้จ่าย", [
          { text: "+ สร้างทริป", onPress: createTrip },
          { text: "ยกเลิก", style: "cancel" },
        ]);
      }
      return;
    }
    setExpenseTripId(tid);
    setExpenseTitle("");
    setExpenseAmount("");
    setExpenseCategory("other");
    setExpenseError("");
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

  const settleTransfer = (transfer, tripId = null) => {
    if (isOffline) {
      showToast("ไม่มีอินเทอร์เน็ต", "error");
      return;
    }
    if (transfer.from !== userId && transfer.to !== userId) {
      showAlert("ทำรายการไม่ได้", "บันทึกการโอนได้เฉพาะรายการที่คุณเป็นผู้โอนหรือผู้รับเงิน");
      return;
    }
    showAlert(
      "ยืนยันการโอนเงิน",
      `บันทึกว่า ${getMemberName(transfer.from)} โอนให้ ${getMemberName(transfer.to)} จำนวน ${baht(transfer.amount)} แล้วใช่ไหม?`,
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ยืนยัน",
          onPress: async () => {
            try {
              const connectivity = await NetInfo.fetch();
              if (connectivity.isConnected === false || connectivity.isInternetReachable === false) {
                setIsOffline(true);
                showToast("ไม่มีอินเทอร์เน็ต", "error");
                return;
              }
              setBusy(true);
              const { error } = await supabase.from("settlements").insert({
                group_id: activeGroup.id,
                trip_id: tripId,
                from_user: transfer.from,
                to_user: transfer.to,
                amount: transfer.amount,
              });
              if (error) throw error;
              await loadSettlements(activeGroup.id);
              showToast("บันทึกการโอนเรียบร้อยแล้ว");
            } catch (e) {
              showAlert("บันทึกไม่สำเร็จ", friendlyError(e));
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  const deleteExpense = (expId, expTitle) => {
    const doDelete = async () => {
      setBusy(true);
      try {
        const { data: deletedExpense, error } = await supabase
          .from("expenses")
          .delete()
          .eq("id", expId)
          .eq("group_id", activeGroup.id)
          .select("id")
          .maybeSingle();
        if (error) throw error;
        if (!deletedExpense) throw new Error("ไม่พบรายการหรือไม่มีสิทธิ์ลบ");
        if (selectedTrip) await loadTripExpenses(selectedTrip.id);
        if (activeGroup) {
          await loadTrips(userId, activeGroup.id);
          await loadGroupExpenses(activeGroup.id);
          await loadSettlements(activeGroup.id);
        }
        showToast("ลบรายการเรียบร้อยแล้ว");
      } catch (error) {
        showAlert("ลบไม่สำเร็จ", friendlyError(error));
      } finally {
        setBusy(false);
      }
    };

    showAlert(
      "ยืนยันการลบ",
      `ต้องการลบรายการ "${expTitle || "นี้"}" หรือไม่?`,
      [
        { text: "ยกเลิก", style: "cancel" },
        { text: "ลบรายการ", style: "destructive", onPress: doDelete },
      ]
    );
  };

  const saveExpense = async () => {
    if (isOffline) {
      showToast("ไม่มีอินเทอร์เน็ต", "error");
      return;
    }
    if (!activeGroup || trips.length === 0) {
      setExpenseError("กรุณาสร้างหรือเลือกทริปในกลุ่มก่อนบันทึกค่าใช้จ่าย");
      return;
    }

    if (!expenseTitle.trim()) {
      setExpenseError("กรุณาระบุชื่อรายการหรือชื่อร้านอาหาร");
      return;
    }

    const targetTripId = expenseTripId || selectedTrip?.id || (trips[0] && trips[0].id);
    if (!targetTripId) {
      setExpenseError("กรุณาเลือกทริปที่ต้องการบันทึก");
      return;
    }
    if (!trips.some((trip) => trip.id === targetTripId)) {
      setExpenseError("ทริปที่เลือกไม่อยู่ในกลุ่มปัจจุบัน กรุณาเลือกทริปใหม่");
      return;
    }

    const payer = expensePayer || userId;
    const selectedParticipants = Array.from(new Set(expenseParticipants));
    let amt = 0;
    if (splitMode === "itemized") {
      if (expenseItems.length === 0) {
        setExpenseError("กรุณาเพิ่มอย่างน้อย 1 รายการอาหาร");
        return;
      }

      for (let i = 0; i < expenseItems.length; i++) {
        const it = expenseItems[i];
        if (!it.name.trim()) {
          setExpenseError(`กรุณาระบุชื่อเมนูสำหรับรายการที่ ${i + 1}`);
          return;
        }
        const itPrice = Number(String(it.amount).replace(/,/g, "")) || 0;
        if (itPrice <= 0) {
          setExpenseError(`กรุณากรอกราคาของเมนู "${it.name.trim()}" มากกว่า 0`);
          return;
        }
        if (!it.participants || it.participants.length === 0) {
          setExpenseError(`กรุณาเลือกเพื่อนที่กินเมนู "${it.name.trim()}" อย่างน้อย 1 คน`);
          return;
        }
        amt += itPrice;
      }

    } else {
      if (selectedParticipants.length === 0) {
        setExpenseError("กรุณาเลือกเพื่อนอย่างน้อย 1 คนเพื่อหารค่าใช้จ่าย");
        return;
      }
      amt = Number(expenseAmount.replace(/,/g, "")) || 0;
      if (amt <= 0) {
        setExpenseError("กรุณากรอกจำนวนเงินมากกว่า 0");
        return;
      }

    }

    setBusy(true);

    try {
      const { data: createdExpense, error } = await supabase.from("expenses").insert({
        group_id: activeGroup.id,
        title: expenseTitle.trim(),
        category: expenseCategory,
        amount: amt,
        paid_by: payer,
        trip_id: targetTripId,
        split_between: splitMode === "itemized"
          ? Array.from(new Set(expenseItems.flatMap((item) => item.participants)))
          : selectedParticipants,
        slip_url: null,
        is_settled: false,
      }).select("id").single();

      if (error) throw error;
      if (splitMode === "itemized") {
        const { error: itemError } = await supabase.from("expense_items").insert(
          expenseItems.map((item) => ({
            expense_id: createdExpense.id,
            name: item.name.trim(),
            amount: Number(String(item.amount).replace(/,/g, "")) || 0,
            participants: item.participants,
          }))
        );
        if (itemError) {
          const { error: rollbackError } = await supabase
            .from("expenses")
            .delete()
            .eq("id", createdExpense.id);
          if (rollbackError) {
            throw new Error(`${itemError.message}. ลบรายการที่บันทึกค้างไว้ไม่สำเร็จ: ${rollbackError.message}`);
          }
          throw itemError;
        }
      }
      setExpenseModal(false);
      setExpenseTitle("");
      setExpenseAmount("");
      setExpenseItems([]);
      setExpenseError("");

      if (selectedTrip && selectedTrip.id === targetTripId) {
        await loadTripExpenses(targetTripId);
      }
      await loadTrips(userId, activeGroup.id);
      await loadGroupExpenses(activeGroup.id);
      await loadSettlements(activeGroup.id);

      const targetTrip = trips.find((t) => t.id === targetTripId);
      showToast(`บันทึกค่าใช้จ่าย ${baht(amt)} ในทริป "${targetTrip?.title || ""}" เรียบร้อยแล้ว`);
    } catch (error) {
      showAlert("บันทึกไม่สำเร็จ", friendlyError(error));
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
                    showAlert(
                      "ยังไม่ได้เลือกกลุ่ม",
                      "กรุณาเลือกหรือสร้างกลุ่มก่อนบันทึกค่าใช้จ่าย",
                      [
                        { text: "ไปหน้ากลุ่ม", onPress: () => nav("groups") },
                        { text: "ยกเลิก", style: "cancel" },
                      ]
                    );
                  } else {
                    showAlert(
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
              <View style={s.expenseAmountHero}>
                <Text style={s.expenseAmountCurrency}>฿</Text>
                {splitMode === "equal" ? (
                  <TextInput
                    inputRef={expenseAmountInputRef}
                    style={s.expenseAmountInput}
                    placeholder="0.00"
                    placeholderTextColor={C.pinkLight}
                    value={expenseAmount}
                    onChangeText={(value) => {
                      setExpenseError("");
                      setExpenseAmount(value);
                    }}
                    keyboardType="decimal-pad"
                    autoFocus={splitMode === "equal"}
                    returnKeyType="next"
                    onSubmitEditing={() => expenseTitleInputRef.current?.focus()}
                    selectTextOnFocus
                  />
                ) : (
                  <Text style={s.expenseAmountValue}>
                    {expenseItems
                      .reduce((sum, item) => sum + (Number(String(item.amount).replace(/,/g, "")) || 0), 0)
                      .toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                )}
              </View>
              {splitMode === "itemized" && (
                <Text style={s.expenseAmountCaption}>ยอดรวมอาหาร</Text>
              )}

              <Input
                inputRef={expenseTitleInputRef}
                label={splitMode === "itemized" ? "ชื่อร้าน / ชื่อมื้ออาหาร" : "ชื่อรายการ"}
                placeholder={splitMode === "itemized" ? "เช่น มื้อเย็นร้านป้าสมใจ, ข้าวแกง" : "เช่น ค่าอาหารค่ำ, ค่าน้ำมัน"}
                value={expenseTitle}
                onChangeText={(value) => {
                  setExpenseError("");
                  setExpenseTitle(value);
                }}
                returnKeyType="next"
                onSubmitEditing={() => Keyboard.dismiss()}
                icon="receipt-outline"
              />

              <Text style={s.modalFieldTitle}>หมวดหมู่</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={s.categoryPicker}
                contentContainerStyle={s.categoryPickerContent}
              >
                {CATEGORIES.map((category) => {
                  const selected = expenseCategory === category.id;
                  return (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        s.categoryChip,
                        { backgroundColor: selected ? category.bg : C.white, borderColor: selected ? category.color : C.border },
                      ]}
                      onPress={() => {
                        setExpenseError("");
                        setExpenseCategory(category.id);
                      }}
                      activeOpacity={0.75}
                    >
                      <Ionicons name={category.icon} size={16} color={category.color} />
                      <Text style={[s.categoryChipText, { color: selected ? category.color : C.textMuted }]}>
                        {category.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* SPLIT MODE SELECTOR */}
              <View style={s.splitModeSelector}>
                <TouchableOpacity
                  style={[s.splitModeTab, splitMode === "equal" && s.splitModeTabActive]}
                  onPress={() => {
                    setExpenseError("");
                    setSplitMode("equal");
                  }}
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
                    setExpenseError("");
                    setSplitMode("itemized");
                    setExpenseCategory("food");
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

              {/* EQUAL SPLIT MODE */}
              {splitMode === "equal" && (
                <>
                  {/* PARTICIPANTS SPLIT SELECTION */}
                  <View style={{ marginBottom: 14 }}>
                    <View style={s.splitHeaderRow}>
                      <Text style={s.modalFieldTitle}>ใครต้องร่วมหารบ้าง?</Text>
                      <TouchableOpacity
                        onPress={() => {
                          setExpenseError("");
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
                              setExpenseError("");
                              if (isChecked) {
                                setExpenseParticipants(
                                  expenseParticipants.filter((id) => id !== m.user_id)
                                );
                              } else {
                                setExpenseParticipants([...expenseParticipants, m.user_id]);
                              }
                            }}
                          >
                            <Avatar
                              name={mName}
                              uri={m.profile?.avatar_url}
                              size={22}
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
                            <Ionicons
                              name={isChecked ? "checkmark-circle" : "ellipse-outline"}
                              size={16}
                              color={isChecked ? C.pinkDark : C.border}
                            />
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
                              {baht(
                                Number(expenseAmount.replace(/,/g, "")) /
                                expenseParticipants.length
                              )}
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
                    <Ionicons name="sparkles" size={16} color={C.amber} />
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
                              <Ionicons name="trash-outline" size={16} color={C.red} />
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
                                  <Avatar
                                    name={mName}
                                    uri={m.profile?.avatar_url}
                                    size={22}
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
                                  <Ionicons
                                    name={isChecked ? "checkmark-circle" : "ellipse-outline"}
                                    size={14}
                                    color={isChecked ? C.white : C.muted}
                                    style={{ marginLeft: 4 }}
                                  />
                                </TouchableOpacity>
                              );
                            })}
                          </View>

                          {itPrice > 0 && item.participants.length > 0 && (
                            <View style={s.subItemSharePreview}>
                              <Ionicons name="people-outline" size={12} color={C.blue} />
                              <Text style={s.subItemSharePreviewText}>
                                หาร {item.participants.length} คน (คนละ {baht(itShare)})
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
                        {baht(expenseItems.reduce(
                          (sum, it) => sum + (Number(String(it.amount).replace(/,/g, "")) || 0),
                          0
                        ))}
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
                            {baht(Math.round(mShare * 100) / 100)}
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
                        onPress={() => {
                          setExpenseError("");
                          setExpensePayer(m.user_id);
                        }}
                        style={[
                          s.payerChip,
                          isSelected && s.payerChipActive,
                        ]}
                        activeOpacity={0.8}
                      >
                        <Avatar
                          name={mName}
                          uri={m.profile?.avatar_url}
                          size={22}
                        />
                        <Text
                          style={[
                            s.payerChipText,
                            isSelected && s.payerChipTextActive,
                          ]}
                        >
                          {mName}
                        </Text>
                        {isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={15}
                            color={C.white}
                            style={{ marginLeft: 4 }}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {groups.length > 1 && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={s.modalFieldTitle}>เลือกกลุ่ม</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {groups.map((group) => {
                      const selected = activeGroup?.id === group.id;
                      return (
                        <TouchableOpacity
                          key={group.id}
                          onPress={async () => {
                            setExpenseError("");
                            const selectedTrips = await selectGroup(group);
                            if (!selectedTrips.length) {
                              setExpenseModal(false);
                              showAlert(
                                "กลุ่มนี้ยังไม่มีทริป",
                                "สร้างทริปก่อนจึงจะบันทึกค่าใช้จ่ายได้",
                                [
                                  { text: "สร้างทริป", onPress: createTrip },
                                  { text: "ยกเลิก", style: "cancel" },
                                ]
                              );
                            }
                          }}
                          style={[s.payerChip, selected && s.payerChipActive]}
                        >
                          <Text style={[s.payerChipText, selected && s.payerChipTextActive]}>
                            {group.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
              <Text style={s.modalSubtitle}>
                {trips.find((t) => t.id === (expenseTripId || selectedTrip?.id || trips[0]?.id))?.title
                  ? `ทริป: ${trips.find((t) => t.id === (expenseTripId || selectedTrip?.id || trips[0]?.id))?.title}`
                  : "บันทึกรายจ่ายสำหรับทริปนี้"}
              </Text>
              {trips.length > 0 && (
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
                          onPress={() => {
                            setExpenseError("");
                            setExpenseTripId(t.id);
                          }}
                          style={{
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            borderRadius: R.md,
                            backgroundColor: isSelected ? C.pink : C.pinkLight,
                            marginRight: 8,
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: "Prompt_500Medium",
                              fontSize: 13,
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

              {!!expenseError && (
                <Text style={s.expenseError}>
                  {expenseError}
                </Text>
              )}
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
                  setExpenseError("");
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
                <Text style={[s.modalAmountVal, { fontSize: 30, color: C.pinkDark }]}>
                  {baht(viewingQrModal.amount)}
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

            {!!viewingQrModal?.qrUri && (
              <TouchableOpacity
                style={s.qrSaveButton}
                activeOpacity={0.8}
                onPress={saveQrImageToDevice}
              >
                <Ionicons name="download-outline" size={17} color={C.pinkDark} />
                <Text style={s.qrSaveButtonText}>บันทึก QR ลงเครื่อง</Text>
              </TouchableOpacity>
            )}

            {(!!viewingQrModal?.promptpay || !!viewingQrModal?.bankName) && (
              <View style={s.qrMetaCard}>
                {!!viewingQrModal?.promptpay && (
                  <View style={s.qrMetaRow}>
                    <Text style={s.qrMetaLabel}>เบอร์พร้อมเพย์:</Text>
                    <Text style={s.qrMetaValue}>{viewingQrModal.promptpay}</Text>
                    <TouchableOpacity
                      style={s.copyMiniBtn}
                      onPress={async () => {
                        await Clipboard.setStringAsync(String(viewingQrModal.promptpay));
                        showToast(`คัดลอก ${viewingQrModal.promptpay} เรียบร้อยแล้ว`);
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
              💡 เปิดแอปธนาคาร → สแกนจากรูปในเครื่อง
            </Text>

            <View style={{ width: "100%", flexDirection: "row", marginTop: 14 }}>
              {viewingQrModal?.userId === userId && (
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
              )}

              <TouchableOpacity
                style={[
                  s.modalBtnPrimary,
                  { flex: viewingQrModal?.userId === userId ? 1 : 2, marginLeft: viewingQrModal?.userId === userId ? 8 : 0 },
                ]}
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
                      <Ionicons name="trash-outline" size={14} color={C.red} />
                      <Text style={[s.qrImagePickAgainText, { color: C.red }]}>ลบรูป</Text>
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
      <Modal
        visible={notificationModal}
        transparent
        animationType="slide"
        onRequestClose={closeNotifications}
      >
        <Pressable style={s.sheetOverlay} onPress={closeNotifications}>
          <Pressable style={[s.bottomSheet, { maxHeight: "78%" }]} onPress={() => {}}>
            <View style={s.sheetHandle} />
            <Text style={s.modalTitle}>การแจ้งเตือน</Text>
            {notificationRows.length === 0 ? (
              <View style={s.notificationEmpty}>
                <Duck style={{ width: 130, height: 130 }} />
                <Text style={s.emptyTripTitle}>ยังไม่มีการแจ้งเตือนในขณะนี้</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {notificationRows.map((item) => (
                  <View key={item.id} style={[s.notificationRow, !item.is_read && s.notificationUnread]}>
                    <View style={s.notificationIcon}>
                      <Ionicons name="notifications-outline" size={18} color={C.pinkDark} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.groupCardTitle}>{item.title}</Text>
                      <Text style={s.groupCardDesc}>{item.message}</Text>
                      <Text style={s.notificationDate}>
                        {new Date(item.created_at).toLocaleString("th-TH")}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
            <Button title="ปิด" outline onPress={closeNotifications} style={{ marginTop: 10 }} />
          </Pressable>
        </Pressable>
      </Modal>
      {noticeSheet()}
    </>
  );

  // ========================================
  // 23. LOADING
  // ========================================

  if (!fontsLoaded || checkingSession) {
    return (
      <View style={s.loadingScreen}>
        <AmbientBackground />
        <Duck style={{ width: 140, height: 140 }} />
        <ActivityIndicator
          size="large"
          color={C.pink}
        />

        <Text style={s.loadingText}>
          กำลังโหลด TripBuddies...
        </Text>
        {noticeSheet()}
      </View>
    );
  }

  if (screen === "onboarding") {
    const slides = [
      {
        icon: "people-outline",
        title: "สร้างกลุ่มเที่ยวกับเพื่อน",
        description: "วางแผนทริปร่วมกันในกลุ่มเดียว",
      },
      {
        icon: "restaurant-outline",
        title: "จดบิลหารง่าย แยกตามเมนูได้",
        description: "รู้ชัดว่าใครกินอะไร และต้องจ่ายเท่าไร",
      },
      {
        icon: "qr-code-outline",
        title: "โอนผ่าน QR จบในแอปเดียว",
        description: "ดูยอดที่ต้องโอนและสแกนจ่ายได้สะดวก",
      },
    ];

    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" />
        <AmbientBackground />
        {noticeSheet()}
        <View style={s.onboardingScreen}>
          <TouchableOpacity
            style={s.onboardingSkip}
            onPress={finishOnboarding}
            accessibilityRole="button"
            accessibilityLabel="ข้ามการแนะนำ"
          >
            <Text style={s.onboardingSkipText}>ข้าม</Text>
          </TouchableOpacity>

          <ScrollView
            ref={onboardingScrollRef}
            horizontal
            pagingEnabled
            bounces={false}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const nextPage = Math.round(event.nativeEvent.contentOffset.x / windowWidth);
              setOnboardingPage(Math.max(0, Math.min(nextPage, slides.length - 1)));
            }}
          >
            {slides.map((slide) => (
              <View key={slide.title} style={[s.onboardingSlide, { width: windowWidth }]}>
                <View style={s.onboardingIconCircle}>
                  <Ionicons name={slide.icon} size={34} color={C.pinkDark} />
                </View>
                <Duck style={s.onboardingDuck} />
                <Text style={s.onboardingTitle}>{slide.title}</Text>
                <Text style={s.onboardingDescription}>{slide.description}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={s.onboardingFooter}>
            <View style={s.onboardingPagination}>
              {slides.map((slide, index) => (
                <View
                  key={slide.title}
                  style={[
                    s.onboardingDot,
                    onboardingPage === index && s.onboardingDotActive,
                  ]}
                />
              ))}
            </View>
            <Button
              title={onboardingPage === slides.length - 1 ? "เริ่มเลย" : "ถัดไป"}
              icon={onboardingPage === slides.length - 1 ? "arrow-forward" : undefined}
              onPress={continueOnboarding}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ========================================
  // 24. LANDING
  // ========================================

  if (screen === "landing") {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" />
        <AmbientBackground />
        {noticeSheet()}

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
        <AmbientBackground />
        {noticeSheet()}

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
                onChangeText={handleEmailChange}
                error={emailError}
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
                    showAlert(
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
                    showAlert(
                      "ส่งอีเมลไม่สำเร็จ",
                      friendlyError(error)
                    );
                  } else {
                    showAlert(
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
        <AmbientBackground />
        {noticeSheet()}

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
                onChangeText={(value) => setPhone(value.replace(/\D/g, "").slice(0, 10))}
                keyboardType="phone-pad"
                maxLength={10}
                icon="call-outline"
              />

              <Input
                label="อีเมล"
                placeholder="example@email.com"
                value={email}
                onChangeText={handleEmailChange}
                error={emailError}
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
          <AmbientBackground />
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

              <TouchableOpacity style={s.coverUploadButton} onPress={() => pickAndUploadImage("group-cover")}>
                <Ionicons name="image-outline" size={18} color={C.pinkDark} />
                <Text style={s.coverUploadText}>{groupCoverUrl ? "เปลี่ยนรูปปกกลุ่ม" : "เพิ่มรูปปกกลุ่ม"}</Text>
              </TouchableOpacity>
              {!!groupCoverUrl && <Image source={{ uri: groupCoverUrl }} style={s.coverPreview} />}
              <Button
                title="+ สร้างกลุ่ม"
                onPress={() => {
                  setGroupName("");
                  setGroupCoverUrl("");
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
                autoCapitalize="characters"
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
                <Duck style={{ width: 120, height: 120 }} />
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
                {activeGroup.cover_url ? (
                  <Image source={{ uri: activeGroup.cover_url }} style={s.groupCoverImage} />
                ) : null}
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
                    onPress={copyInviteCode}
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
                      <TouchableOpacity
                        style={s.memberAvatar}
                        onPress={() => {
                          const qr = memberQrMap[member.user_id] || {};
                          setViewingQrModal({
                            userId: member.user_id,
                            name: member.profile?.full_name || memberDisplayName,
                            amount: 0,
                            promptpay: qr.promptpay || member.profile?.phone || "",
                            bankName: qr.bankName || "",
                            accountName: qr.accountName || member.profile?.full_name || "",
                            qrUri: qr.qrUri || member.profile?.qr_code_url || "",
                          });
                        }}
                      >
                        <Avatar
                          name={memberDisplayName}
                          uri={member.profile?.avatar_url}
                          size={40}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity style={{ flex: 1, paddingRight: 8 }} onPress={() => {
                        const qr = memberQrMap[member.user_id] || {};
                        setViewingQrModal({
                          userId: member.user_id,
                          name: member.profile?.full_name || memberDisplayName,
                          amount: 0,
                          promptpay: qr.promptpay || member.profile?.phone || "",
                          bankName: qr.bankName || "",
                          accountName: qr.accountName || member.profile?.full_name || "",
                          qrUri: qr.qrUri || member.profile?.qr_code_url || "",
                        });
                      }}>
                        <Text style={s.memberName}>{memberDisplayName}</Text>
                        <Text style={s.memberRoleSub}>
                          {member.role === "owner" ? "เจ้าของกลุ่ม 👑" : member.role === "admin" ? "แอดมิน" : "สมาชิก"}
                        </Text>
                      </TouchableOpacity>

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

                    {trips.length === 0 ? (
                      <View style={s.emptyTrip}>
                        <Duck style={{ width: 100, height: 100 }} />
                        <Text style={s.emptyTripTitle}>ยังไม่มีทริปในกลุ่มนี้</Text>
                        <Text style={s.emptyTripText}>สร้างทริปแรกเพื่อเริ่มบันทึกค่าใช้จ่าย</Text>
                      </View>
                    ) : trips.map((trip) => (
                      <TouchableOpacity
                        key={trip.id}
                        style={s.otherTripCard}
                        activeOpacity={0.8}
                        onPress={() => openTripDetail(trip)}
                      >
                        <View style={s.otherTripIcon}>
                          {trip.cover_url
                            ? <Image source={{ uri: trip.cover_url }} style={s.tripListImage} />
                            : <Ionicons name="airplane-outline" size={18} color={C.pinkDark} />}
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

                <Button
                  title="สร้างทริปใหม่"
                  onPress={() => {
                    setTab("home");
                    setScreen("home");
                    createTrip();
                  }}
                />
                <Button
                  title={activeGroup.created_by === userId || activeGroup.role === "owner" ? "ลบกลุ่ม" : "ออกจากกลุ่ม"}
                  outline
                  onPress={confirmGroupExit}
                  disabled={groupActionBusy}
                  style={{ marginTop: 10 }}
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
                <TouchableOpacity style={s.coverUploadButton} onPress={() => pickAndUploadImage("group-cover")}>
                  <Ionicons name="image-outline" size={18} color={C.pinkDark} />
                  <Text style={s.coverUploadText}>{groupCoverUrl ? "เปลี่ยนรูปปก" : "อัปโหลดรูปปกกลุ่ม"}</Text>
                </TouchableOpacity>
                {!!groupCoverUrl && <Image source={{ uri: groupCoverUrl }} style={s.coverPreview} />}

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
    const groupSettlement = calculateSettlement(groupExpenses, members, settlements);
    const owedToYou = groupSettlement.transfers
      .filter((transfer) => transfer.to === userId)
      .reduce((sum, transfer) => sum + transfer.amount, 0);
    const youOwe = groupSettlement.transfers
      .filter((transfer) => transfer.from === userId)
      .reduce((sum, transfer) => sum + transfer.amount, 0);
    const groupTotal = groupExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const paidBack = settlements.reduce((s, p) => s + p.amount, 0);
    const repaymentProgress = groupTotal > 0 ? Math.min(paidBack / groupTotal, 1) : 0;

    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" />

        <View style={s.appScreen}>
          <AmbientBackground />
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
                {profileAvatarUrl ? (
                  <Image source={{ uri: profileAvatarUrl }} style={s.homeAvatarImage} />
                ) : (
                  <Duck style={s.homeAvatarImage} />
                )}
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
                onPress={openNotifications}
              >
                <Ionicons name="notifications-outline" size={20} color={C.text} />
                {notificationRows.some((item) => !item.is_read) && (
                  <View style={s.notificationDot} />
                )}
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
                <Duck style={{ width: 110, height: 110 }} />
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
                  {latestTrip.cover_url
                    ? <Image source={{ uri: latestTrip.cover_url }} style={s.tripPhotoImage} />
                    : <Ionicons name="compass" size={32} color={C.blue} />}
                </View>

                <View style={s.tripInfo}>
                  <View style={s.tripTitleRow}>
                    <Text style={s.tripName} numberOfLines={1}>
                      {latestTrip.title}
                    </Text>
                    <View style={s.destinationBadge}>
                      <Ionicons name="location-sharp" size={11} color={C.pinkDark} />
                      <Text style={s.destinationText} numberOfLines={1}>
                        {latestTrip.destination || "ทริปในกลุ่ม"}
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
                <Duck style={{ width: 110, height: 110 }} />
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

            <View style={s.debtSummaryCard}>
              <Text style={s.groupCardTitle}>สรุปยอดหนี้ในกลุ่ม</Text>
              <View style={s.debtSummaryRow}>
                <View style={s.debtSummaryItem}>
                  <Text style={s.budgetChipLabel}>เพื่อนค้างเรา</Text>
                  <Text style={[s.debtAmount, { color: C.green }]}>{baht(owedToYou)}</Text>
                </View>
                <View style={s.budgetChipDivider} />
                <View style={s.debtSummaryItem}>
                  <Text style={s.budgetChipLabel}>เราค้างเพื่อน</Text>
                  <Text style={[s.debtAmount, { color: C.pinkDark }]}>{baht(youOwe)}</Text>
                </View>
              </View>
              <View style={s.progressTrack}>
                <View style={[s.progressValue, { width: `${repaymentProgress * 100}%` }]} />
              </View>
              <Text style={s.progressCaption}>
                โอนคืนแล้ว {baht(paidBack)} จากบิลทั้งหมด {baht(groupTotal)}
              </Text>
              {groupSettlement.transfers.filter((transfer) => transfer.to === userId || transfer.from === userId).map((transfer) => {
                const qrTarget = transfer.from === userId ? transfer.to : userId;
                const qr = memberQrMap[qrTarget] || (qrTarget === userId ? userQrData : {});
                return (
                  <View
                    key={`${transfer.from}-${transfer.to}`}
                    style={s.debtTransferRow}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={s.debtTransferText}>
                        {transfer.from === userId
                          ? `คุณค้าง ${getMemberName(transfer.to)} ${baht(transfer.amount)}`
                          : `${getMemberName(transfer.from)} ค้างคุณ ${baht(transfer.amount)}`}
                      </Text>
                      <TouchableOpacity
                        onPress={() => setViewingQrModal({
                          userId: qrTarget,
                          name: qrTarget === userId ? name : getMemberName(qrTarget),
                          amount: transfer.amount,
                          promptpay: qr.promptpay || "",
                          bankName: qr.bankName || "",
                          accountName: qr.accountName || "",
                          qrUri: qr.qrUri || "",
                        })}
                      >
                        <Text style={s.debtTransferAction}>
                          {transfer.from === userId ? "ดู QR เพื่อนเพื่อโอน" : "เปิด QR ของฉัน"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={s.settleTransferButton} onPress={() => settleTransfer(transfer)}>
                      <Text style={s.settleTransferText}>เคลียร์ยอด</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

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
                      {trip.cover_url
                        ? <Image source={{ uri: trip.cover_url }} style={s.tripListImage} />
                        : <Ionicons name="airplane-outline" size={18} color={C.pinkDark} />}
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
                  {baht(totalSpent)}
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
                    showAlert(
                      "ยังไม่ได้เลือกกลุ่ม",
                      "กรุณาเลือกหรือสร้างกลุ่มก่อนบันทึกค่าใช้จ่าย",
                      [
                        { text: "ไปหน้ากลุ่ม", onPress: () => nav("groups") },
                        { text: "ยกเลิก", style: "cancel" },
                      ]
                    );
                  } else {
                    showAlert(
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
                <View style={[s.quickIconBox, { backgroundColor: C.surface }]}>
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

                <TouchableOpacity style={s.coverUploadButton} onPress={() => pickAndUploadImage("trip-cover")}>
                  <Ionicons name="image-outline" size={18} color={C.pinkDark} />
                  <Text style={s.coverUploadText}>{tripCoverUrl ? "เปลี่ยนรูปปกทริป" : "เพิ่มรูปปกทริป"}</Text>
                </TouchableOpacity>
                {!!tripCoverUrl && <Image source={{ uri: tripCoverUrl }} style={s.coverPreview} />}

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
    const settlement = calculateSettlement(
      tripExpenses,
      members,
      settlements.filter((p) => p.trip_id === currentTrip?.id)
    );

    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" />

        <View style={s.appScreen}>
          <AmbientBackground />
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
                    {baht(tripSpent)}
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
                    {baht(Math.round(tripSpent / Math.max(members.length, 1)))}
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
                        fontSize: 13,
                      }}
                    >
                      กำลังโหลดรายการค่าใช้จ่าย...
                    </Text>
                  </View>
                ) : tripExpenses.length === 0 ? (
                  <View style={s.emptyTrip}>
                    <Duck style={{ width: 110, height: 110 }} />
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
                              color={isItemized ? C.amber : C.pinkDark}
                            />
                          </View>

                          <View style={{ flex: 1, paddingHorizontal: 10 }}>
                            <Text style={s.expenseItemTitle}>{exp.title}</Text>
                            <Text style={s.expenseDate}>
                              {new Date(exp.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short" }) + (exp.is_settled ? " • เคลียร์แล้ว" : "")}
                            </Text>
                          </View>

                          <View style={{ alignItems: "flex-end" }}>
                            <Text style={s.expenseItemAmount}>
                              {baht(exp.amount)}
                            </Text>
                            <TouchableOpacity
                              onPress={() => deleteExpense(exp.id, exp.title)}
                              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                              style={s.deleteExpenseBtn}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="trash-outline" size={13} color={C.red} />
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
                              <Ionicons name="restaurant" size={12} color={C.amber} />
                              <Text style={s.expenseItemizedBadgeText}>
                                แยกตามเมนู ({exp.items.length} รายการ)
                              </Text>
                            </View>
                          ) : (
                            <View style={s.expenseShareBadge}>
                              <Ionicons name="people-outline" size={13} color={C.blue} />
                              <Text style={s.expenseShareText}>
                                หาร {pList.length} คน (คนละ {baht(perPerson)})
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
                                          {baht(itPrice)}
                                        </Text>
                                        <Text style={s.subItemAccordionShare}>
                                          หาร {itParts.length} คน (ละ {baht(Math.round(itShare * 100) / 100)})
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
                      ลดจำนวนครั้งที่ต้องโอน
                    </Text>
                    <Text style={s.algoBannerDesc}>
                      ระบบหักลบหนี้ในกลุ่มให้เหลือการโอนน้อยครั้งที่สุดเท่าที่เป็นไปได้
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
                            let text = `📋 สรุปเคลียร์เงินทริป: ${currentTrip?.title || "ทริป"}\nยอดรวมค่าใช้จ่าย: ${baht(tripSpent)}\n--------------------------------\n`;
                            settlement.transfers.forEach((tr, idx) => {
                              const fromName = getMemberName(tr.from);
                              const toName = getMemberName(tr.to);
                              text += `${idx + 1}. ${fromName} ➔ โอนให้ ${toName}: ${baht(tr.amount)}\n`;
                            });
                            text += `--------------------------------\n*รวมโอนเพียง ${settlement.transfers.length} ครั้ง ✨`;
                            showAlert("สรุปยอดเคลียร์เงิน", text);
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
                              <Avatar
                                name={fromName}
                                uri={members.find((member) => member.user_id === tr.from)?.profile?.avatar_url}
                                size={34}
                              />
                              <Text style={s.transferPartyName} numberOfLines={1}>
                                {fromName}
                              </Text>
                              <Text style={s.transferPartyRole}>ผู้โอนเงิน</Text>
                            </View>

                            <View style={s.transferMiddle}>
                              <Text style={s.transferAmount}>
                                {baht(tr.amount)}
                              </Text>
                              <View style={s.transferArrowWrap}>
                                <View style={s.transferArrowLine} />
                                <Ionicons name="arrow-forward" size={15} color={C.pink} />
                              </View>
                              <Text style={s.transferStatusText}>ต้องโอนให้</Text>
                            </View>

                            <View style={s.transferParty}>
                              <Avatar
                                name={toName}
                                uri={members.find((member) => member.user_id === tr.to)?.profile?.avatar_url}
                                size={34}
                              />
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

                          {(tr.from === userId || tr.to === userId) && (
                            <TouchableOpacity
                              style={[s.settleTransferButton, { marginLeft: 0, marginTop: 8, width: "100%", alignItems: "center" }]}
                              onPress={() => settleTransfer(tr, currentTrip.id)}
                            >
                              <Text style={s.settleTransferText}>บันทึกว่าโอนแล้ว</Text>
                            </TouchableOpacity>
                          )}

                          {!receiverQr?.promptpay && !receiverQr?.qrUri && tr.to === userId && (
                            <TouchableOpacity
                              style={{ marginTop: 6, alignSelf: "center", paddingVertical: 2 }}
                              activeOpacity={0.8}
                              onPress={() => openQrSetupModal(userId, name || "ฉัน")}
                            >
                              <Text style={{ fontFamily: "Prompt_500Medium", fontSize: 11, color: C.pinkDark }}>
                                + อัปโหลด QR ของฉัน
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
                        <Avatar
                          name={mName}
                          uri={member.profile?.avatar_url}
                          size={36}
                        />

                        <View style={{ flex: 1, paddingHorizontal: 10 }}>
                          <Text style={s.breakdownName}>
                            {mName}
                          </Text>
                          <Text style={s.breakdownSub}>
                            ออกไป {baht(paid)} • ยอดหาร {baht(owed)}
                          </Text>
                        </View>

                        {/* QR QUICK BUTTON FOR MEMBER */}
                        {roundedNet > 0.01 && (
                          <TouchableOpacity
                            style={s.breakdownQrBtn}
                            activeOpacity={0.7}
                            onPress={() => {
                              setViewingQrModal({
                                userId: mId,
                                name: mName,
                                amount: roundedNet,
                                promptpay: mQr?.promptpay || "",
                                bankName: mQr?.bankName || "",
                                accountName: mQr?.accountName || "",
                                qrUri: mQr?.qrUri || mQr?.uri || mQr?.base64 || mQr?.qr || "",
                              });
                            }}
                          >
                            <Ionicons name="qr-code-outline" size={15} color={C.pinkDark} />
                          </TouchableOpacity>
                        )}

                        <View style={{ alignItems: "flex-end" }}>
                          {roundedNet > 0.01 ? (
                            <View style={s.badgeNetPositive}>
                              <Text style={s.badgeNetPositiveText}>
                                + ได้รับ {baht(roundedNet)}
                              </Text>
                            </View>
                          ) : roundedNet < -0.01 ? (
                            <View style={s.badgeNetNegative}>
                              <Text style={s.badgeNetNegativeText}>
                                - ต้องโอน {baht(Math.abs(roundedNet))}
                              </Text>
                            </View>
                          ) : (
                            <View style={s.badgeNetZero}>
                              <Text style={s.badgeNetZeroText}>
                                พอดี {baht(0)}
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
          <AmbientBackground />
          <ScrollView
            contentContainerStyle={s.profileContent}
          >
            <Text style={s.profileTitle}>
              โปรไฟล์
            </Text>

            <Text style={s.subtitle}>
              จัดการข้อมูลส่วนตัวของคุณ
            </Text>

            <TouchableOpacity style={s.profileCoverWrap} onPress={() => pickAndUploadImage("profile-cover")}>
              {profileCoverUrl ? (
                <Image source={{ uri: profileCoverUrl }} style={s.profileCoverImage} />
              ) : (
                <View style={s.profileCoverPlaceholder}>
                  <Ionicons name="image-outline" size={22} color={C.pinkDark} />
                  <Text style={s.coverUploadText}>เพิ่มรูปปกโปรไฟล์</Text>
                </View>
              )}
              <View style={s.coverEditBadge}><Ionicons name="camera-outline" size={15} color={C.white} /></View>
            </TouchableOpacity>

            <View style={s.profileCard}>
              <View style={s.profileAvatarWrap}>
                <TouchableOpacity style={s.profileAvatarRing} onPress={() => pickAndUploadImage("avatar")}>
                  {profileAvatarUrl
                    ? <Image source={{ uri: profileAvatarUrl }} style={s.profileAvatarImage} />
                    : <Duck style={s.profileDuck} />}
                  <View style={s.avatarEditBadge}><Ionicons name="camera" size={12} color={C.white} /></View>
                </TouchableOpacity>
                <View style={s.profileVerifiedBadge}>
                  <Ionicons name="checkmark" size={12} color={C.white} />
                </View>
              </View>

              <Text style={s.profileName}>
                {name || "Trip Explorer"}
              </Text>

              <View style={s.profileBadge}>
                <Ionicons name="sparkles" size={11} color={C.amber} style={{ marginRight: 4 }} />
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
                  {userQrData.qrUri ? (
                    <Image
                      source={{ uri: userQrData.qrUri }}
                      style={s.profileQrLarge}
                      resizeMode="contain"
                    />
                  ) : null}
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
                        <Ionicons name="trash-outline" size={13} color={C.red} />
                        <Text style={[s.userQrActionText, { color: C.red }]}>ลบ</Text>
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
                  setProfileModal(true)
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
                onPress={openNotifications}
              >
                <View style={[s.settingIconBox, { backgroundColor: C.blueLight }]}>
                  <Ionicons name="notifications-outline" size={18} color={C.blue} />
                </View>

                <Text style={s.settingText}>
                  การแจ้งเตือน
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

            <Modal visible={profileModal} transparent animationType="slide" onRequestClose={() => setProfileModal(false)}>
              <KeyboardAvoidingView style={s.sheetOverlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <View style={s.bottomSheet}>
                  <View style={s.sheetHandle} />
                  <Text style={s.modalTitle}>แก้ไขข้อมูลส่วนตัว</Text>
                  <Input label="ชื่อ - นามสกุล" value={name} onChangeText={setName} icon="person-outline" />
                  <Input
                    label="เบอร์โทรศัพท์"
                    value={phone}
                    onChangeText={(value) => setPhone(value.replace(/\D/g, "").slice(0, 10))}
                    keyboardType="phone-pad"
                    maxLength={10}
                    icon="call-outline"
                  />
                  <Button title={busy ? "กำลังบันทึก..." : "บันทึกโปรไฟล์"} onPress={saveProfileData} disabled={busy} />
                  <Button title="ยกเลิก" outline onPress={() => setProfileModal(false)} style={{ marginTop: 8 }} />
                </View>
              </KeyboardAvoidingView>
            </Modal>
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
    fontSize: 13,
    marginTop: 3,
    letterSpacing: 0.2,
  },

  button: {
    minHeight: 52,
    borderRadius: 999,
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
    fontSize: 13,
    color: C.text,
    marginBottom: 7,
    marginLeft: 3,
  },

  inputContainer: {
    minHeight: 50,
    borderRadius: R.md,
    borderWidth: 0,
    backgroundColor: "#F3EAE3",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0,
    elevation: 0,
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

  inputErrorText: {
    fontFamily: "Prompt_400Regular",
    color: C.red,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 3,
    marginLeft: 4,
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
    borderRadius: R.md,
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

  headerTitle: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 16,
    color: C.text,
    letterSpacing: -0.2,
  },

  // LANDING

  onboardingScreen: {
    flex: 1,
  },

  onboardingSkip: {
    minHeight: 44,
    alignSelf: "flex-end",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  onboardingSkipText: {
    color: C.textMuted,
    fontFamily: "Prompt_500Medium",
    fontSize: 13,
  },

  onboardingSlide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 20,
  },

  onboardingIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.pinkLight,
    marginBottom: 8,
  },

  onboardingDuck: {
    width: 150,
    height: 150,
    marginBottom: 12,
  },

  onboardingTitle: {
    fontFamily: "Prompt_700Bold",
    color: C.text,
    fontSize: 21,
    lineHeight: 34,
    textAlign: "center",
  },

  onboardingDescription: {
    fontFamily: "Prompt_400Regular",
    color: C.textMuted,
    fontSize: 13,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 6,
  },

  onboardingFooter: {
    paddingHorizontal: 22,
    paddingBottom: 18,
  },

  onboardingPagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  onboardingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.border,
    marginHorizontal: 4,
  },

  onboardingDotActive: {
    width: 24,
    backgroundColor: C.pinkDark,
  },

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
    borderRadius: R.md,
    marginBottom: 10,
  },

  luxuryBadgeText: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 11,
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
    borderRadius: R.md,
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
    fontSize: 13,
    marginTop: 4,
    lineHeight: 20,
    textAlign: "center",
  },

  formCard: {
    backgroundColor: C.white,
    borderRadius: R.lg,
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
    fontSize: 13,
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
    fontSize: 13,
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
    borderRadius: R.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
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
    borderRadius: R.lg,
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
    borderRadius: R.lg,
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
    borderRadius: R.lg,
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
    borderRadius: R.sm,
    marginBottom: 8,
  },

  bannerTagText: {
    fontFamily: "Prompt_600SemiBold",
    color: C.white,
    fontSize: 11,
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
    fontSize: 13,
    marginTop: 3,
  },

  createButton: {
    marginTop: 14,
    backgroundColor: C.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: R.md,
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
    fontSize: 13,
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
    fontSize: 13,
  },

  // GROUPS

  groupActionCard: {
    backgroundColor: C.white,
    borderRadius: R.lg,
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
    borderRadius: R.sm,
  },

  groupStatusTagText: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 11,
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
    borderRadius: R.md,
    padding: 12,
    marginVertical: 10,
  },

  inviteCodeLabel: {
    fontFamily: "Prompt_400Regular",
    fontSize: 11,
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
    borderRadius: R.md,
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
    borderRadius: R.sm,
  },

  memberCountBadgeText: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 11,
    color: C.pinkDark,
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
    fontSize: 13,
    marginTop: 3,
    marginBottom: 14,
  },

  groupItem: {
    minHeight: 72,
    borderRadius: R.md,
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
    borderRadius: R.md,
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
    borderRadius: R.md,
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
    borderRadius: R.md,
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
    borderRadius: R.md,
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
    borderRadius: R.sm,
  },

  destinationText: {
    fontFamily: "Prompt_500Medium",
    color: C.pinkDark,
    fontSize: 11,
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
    borderRadius: R.md,
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
    borderRadius: R.lg,
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
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: R.lg,
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
    borderRadius: R.sm,
  },

  currencyPillText: {
    fontFamily: "Prompt_600SemiBold",
    color: C.pinkDark,
    fontSize: 11,
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
    fontSize: 11,
  },

  budgetChipValue: {
    fontFamily: "Prompt_600SemiBold",
    color: C.text,
    fontSize: 13,
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
    borderRadius: R.md,
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
    borderRadius: R.md,
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
    borderRadius: R.lg,
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
    borderRadius: R.sm,
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
    backgroundColor: C.amberLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: R.sm,
    marginTop: 6,
    marginBottom: 12,
  },

  profileBadgeText: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 11,
    color: C.amber,
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
    fontSize: 13,
  },

  profilePhone: {
    fontFamily: "Prompt_400Regular",
    color: C.textMuted,
    fontSize: 13,
  },

  settingsCard: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.md,
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
    borderRadius: R.sm,
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
    borderRadius: R.lg,
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

  expenseAmountHero: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    marginBottom: 2,
  },

  expenseAmountCurrency: {
    fontFamily: "Prompt_600SemiBold",
    color: C.pinkDark,
    fontSize: 22,
    lineHeight: 34,
    marginRight: 4,
  },

  expenseAmountInput: {
    minWidth: 150,
    maxWidth: "82%",
    color: C.pinkDark,
    fontFamily: "Prompt_700Bold",
    fontSize: 40,
    lineHeight: 56,
    paddingVertical: 0,
    textAlign: "center",
  },

  expenseAmountValue: {
    color: C.pinkDark,
    fontFamily: "Prompt_700Bold",
    fontSize: 40,
    lineHeight: 56,
    textAlign: "center",
  },

  expenseAmountCaption: {
    color: C.textMuted,
    fontFamily: "Prompt_500Medium",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 8,
  },

  modalSubtitle: {
    fontFamily: "Prompt_400Regular",
    color: C.textMuted,
    fontSize: 13,
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
    fontSize: 11,
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
    borderRadius: R.md,
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
    borderRadius: R.md,
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
    borderRadius: R.sm,
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

  categoryPicker: {
    marginTop: 2,
    marginBottom: 12,
  },

  categoryPickerContent: {
    alignItems: "center",
    paddingRight: 4,
  },

  categoryChip: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderRadius: 999,
  },

  categoryChipText: {
    fontFamily: "Prompt_500Medium",
    fontSize: 13,
    marginLeft: 6,
  },

  expenseError: {
    fontFamily: "Prompt_500Medium",
    fontSize: 13,
    lineHeight: 21,
    color: C.red,
    marginBottom: 10,
  },

  payerChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: R.md,
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
    fontSize: 13,
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
    fontSize: 13,
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
    borderRadius: R.sm,
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
    fontSize: 13,
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
    borderRadius: R.md,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#F7D1DA",
  },

  splitPreviewText: {
    fontFamily: "Prompt_500Medium",
    fontSize: 13,
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
    borderRadius: R.md,
    shadowColor: C.pinkDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },

  tripDetailAddBtnText: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 13,
    color: C.white,
    marginLeft: 4,
  },

  tripDetailContent: {
    padding: 20,
    paddingBottom: 40,
  },

  tripHeroCard: {
    backgroundColor: C.white,
    borderRadius: R.lg,
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
    fontSize: 13,
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
    borderRadius: R.sm,
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
    borderRadius: R.md,
    padding: 4,
    marginBottom: 16,
  },

  segmentTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: R.sm,
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
    fontSize: 13,
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
    borderRadius: R.md,
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
    borderRadius: R.sm,
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
    borderRadius: R.sm,
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
    borderRadius: R.sm,
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
    borderRadius: R.md,
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
    borderRadius: R.md,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
  },

  algoBannerTitle: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 13,
    color: C.pinkDark,
  },

  algoBannerDesc: {
    fontFamily: "Prompt_400Regular",
    fontSize: 11,
    color: C.textMuted,
    marginTop: 2,
  },

  settlementCard: {
    backgroundColor: C.white,
    borderRadius: R.lg,
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
    borderRadius: R.sm,
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
    fontSize: 13,
    color: C.textMuted,
    marginTop: 4,
    textAlign: "center",
  },

  transferCard: {
    flexDirection: "column",
    backgroundColor: C.white,
    borderRadius: R.md,
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
    borderRadius: R.sm,
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
    borderRadius: R.sm,
    backgroundColor: C.pinkDark,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  transferQrFullBtnText: {
    flex: 1,
    fontFamily: "Prompt_600SemiBold",
    fontSize: 13,
    color: C.pinkDark,
  },

  breakdownQrBtn: {
    width: 28,
    height: 28,
    borderRadius: R.md,
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
    borderRadius: R.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },

  transferPartyName: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 13,
    color: C.text,
    textAlign: "center",
  },

  transferPartyRole: {
    fontFamily: "Prompt_400Regular",
    fontSize: 11,
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
    fontSize: 11,
    color: C.muted,
  },

  breakdownCard: {
    backgroundColor: C.white,
    borderRadius: R.md,
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
    borderRadius: R.md,
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
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
  },

  badgeNetPositive: {
    backgroundColor: C.greenLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: R.sm,
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
    borderRadius: R.sm,
  },

  badgeNetNegativeText: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 11,
    color: C.orange,
  },

  badgeNetZero: {
    backgroundColor: C.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: R.sm,
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
    borderRadius: R.sm,
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

  deleteExpenseBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.redLight,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginTop: 6,
  },

  deleteExpenseBtnText: {
    fontFamily: "Prompt_500Medium",
    fontSize: 11,
    color: C.red,
    marginLeft: 3,
  },

  // SPLIT MODE SELECTOR STYLES
  splitModeSelector: {
    flexDirection: "row",
    backgroundColor: C.surface,
    borderRadius: R.md,
    padding: 4,
    marginBottom: 14,
  },

  splitModeTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: R.sm,
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
    fontSize: 13,
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
    backgroundColor: C.amberLight,
    padding: 10,
    borderRadius: R.sm,
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
    borderRadius: R.md,
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
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.sm,
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
    backgroundColor: C.surface,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: R.sm,
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
    borderRadius: R.md,
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
    borderRadius: R.md,
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
    fontSize: 13,
    color: C.text,
  },

  itemizedMemberShareAmt: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 13,
    color: C.pinkDark,
  },

  // ITEM CARD IN EXPENSE LIST
  expenseItemizedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.amberLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },

  expenseItemizedBadgeText: {
    fontFamily: "Prompt_500Medium",
    fontSize: 11,
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
    borderRadius: R.sm,
    marginTop: 4,
  },

  accordionToggleText: {
    fontFamily: "Prompt_500Medium",
    fontSize: 11,
    color: C.pinkDark,
    marginLeft: 4,
  },

  subItemsAccordionCard: {
    backgroundColor: C.surface,
    borderRadius: R.sm,
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
    fontSize: 13,
    color: C.text,
  },

  subItemAccordionEaters: {
    fontFamily: "Prompt_400Regular",
    fontSize: 11,
    color: C.muted,
    marginTop: 1,
  },

  subItemAccordionPrice: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 13,
    color: C.pinkDark,
  },

  subItemAccordionShare: {
    fontFamily: "Prompt_400Regular",
    fontSize: 11,
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
    borderRadius: R.md,
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
    borderRadius: R.md,
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
    fontSize: 30,
    color: C.pinkDark,
    letterSpacing: -0.5,
  },

  qrDisplayCard: {
    width: 220,
    height: 220,
    borderRadius: R.md,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: C.surface,
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
    borderRadius: R.sm,
  },

  qrSaveButton: {
    width: "100%",
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.pinkLight,
    borderRadius: R.md,
    marginBottom: 10,
  },

  qrSaveButtonText: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 13,
    color: C.pinkDark,
    marginLeft: 6,
  },

  noQrInsideModal: {
    alignItems: "center",
    padding: 16,
  },

  noQrInsideModalText: {
    fontFamily: "Prompt_400Regular",
    fontSize: 13,
    color: C.muted,
    textAlign: "center",
    marginVertical: 10,
  },

  modalSetupQrBtn: {
    backgroundColor: C.pinkLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: R.sm,
  },

  modalSetupQrBtnText: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 11,
    color: C.pinkDark,
  },

  qrMetaCard: {
    width: "100%",
    backgroundColor: C.surface,
    borderRadius: R.sm,
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
    fontSize: 13,
    color: C.text,
  },

  copyMiniBtn: {
    padding: 4,
    marginLeft: 6,
  },

  qrScanTipText: {
    fontFamily: "Prompt_400Regular",
    fontSize: 11,
    color: C.muted,
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 10,
  },

  modalBtnPrimary: {
    backgroundColor: C.pink,
    borderRadius: R.md,
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
    borderRadius: R.md,
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
    backgroundColor: C.surface,
    borderRadius: R.md,
    padding: 12,
    borderWidth: 1,
    borderColor: C.borderLight,
    marginBottom: 12,
  },

  qrImagePickedPreview: {
    width: 150,
    height: 150,
    borderRadius: R.sm,
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
    borderRadius: R.sm,
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
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: "#F3C5CD",
    borderStyle: "dashed",
    borderRadius: R.md,
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
    fontSize: 13,
    color: C.pinkDark,
    marginTop: 6,
  },

  qrUploadDashedDesc: {
    fontFamily: "Prompt_400Regular",
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
  },

  // PROFILE QR SECTION
  profileQrCard: {
    backgroundColor: C.white,
    borderRadius: R.md,
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
    borderRadius: R.md,
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
    fontSize: 11,
    color: C.textMuted,
    marginTop: 1,
  },

  userQrPreviewBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    padding: 12,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.borderLight,
  },

  userQrThumbWrap: {
    width: 60,
    height: 60,
    borderRadius: R.sm,
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
    fontSize: 13,
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
    fontSize: 11,
    color: C.pinkDark,
    marginLeft: 3,
  },

  noQrPromptBox: {
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: "#F3C5CD",
    borderStyle: "dashed",
    borderRadius: R.md,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  noQrDashedInner: {
    alignItems: "center",
  },

  noQrTitle: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 13,
    color: C.pinkDark,
    marginTop: 4,
  },

  noQrSubtitle: {
    fontFamily: "Prompt_400Regular",
    fontSize: 11,
    color: C.muted,
    marginTop: 2,
    textAlign: "center",
  },

  ambientOrb: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.34,
  },

  ambientOrbPeach: {
    width: 250,
    height: 250,
    right: -90,
    top: 100,
    backgroundColor: "#FFBE9D",
  },

  ambientOrbCoral: {
    width: 190,
    height: 190,
    left: -100,
    bottom: 100,
    backgroundColor: "#F48C76",
    opacity: 0.15,
  },

  duckSpeech: {
    position: "absolute",
    zIndex: 5,
    bottom: -16,
    left: "50%",
    transform: [{ translateX: -100 }],
    width: 200,
    backgroundColor: C.white,
    borderRadius: R.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: C.shadowMedium,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 3,
  },

  duckSpeechText: {
    fontFamily: "Prompt_500Medium",
    fontSize: 11,
    color: C.text,
    textAlign: "center",
  },

  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(34,20,17,0.34)",
    justifyContent: "flex-end",
  },

  bottomSheet: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    backgroundColor: C.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 32 : 22,
    shadowColor: "#38231D",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 18,
  },

  sheetHandle: {
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#E8D8D0",
    alignSelf: "center",
    marginBottom: 14,
  },

  notificationEmpty: {
    alignItems: "center",
    paddingVertical: 18,
  },

  notificationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 13,
    borderRadius: R.md,
    backgroundColor: "#FFF9F5",
    marginTop: 10,
  },

  notificationUnread: {
    backgroundColor: C.pinkLight,
  },

  notificationIcon: {
    width: 36,
    height: 36,
    borderRadius: R.md,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  notificationDate: {
    fontFamily: "Prompt_400Regular",
    fontSize: 11,
    color: C.muted,
    marginTop: 3,
  },

  coverUploadButton: {
    minHeight: 44,
    borderRadius: R.md,
    backgroundColor: C.pinkLight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },

  coverUploadText: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 13,
    color: C.pinkDark,
    marginLeft: 7,
  },

  coverPreview: {
    width: "100%",
    height: 130,
    borderRadius: R.md,
    marginBottom: 12,
  },

  groupCoverImage: {
    width: "100%",
    height: 150,
    borderRadius: R.md,
    marginBottom: 14,
  },

  memberAvatarImage: {
    width: 38,
    height: 38,
    borderRadius: R.md,
  },

  profileCoverWrap: {
    height: 150,
    marginTop: 16,
    borderRadius: R.lg,
    overflow: "hidden",
    backgroundColor: C.pinkLight,
  },

  profileCoverImage: {
    width: "100%",
    height: "100%",
  },

  profileCoverPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  coverEditBadge: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 30,
    height: 30,
    borderRadius: R.md,
    backgroundColor: C.pinkDark,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarEditBadge: {
    position: "absolute",
    right: 1,
    bottom: 1,
    width: 23,
    height: 23,
    borderRadius: R.sm,
    backgroundColor: C.pinkDark,
    alignItems: "center",
    justifyContent: "center",
  },

  profileAvatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 44,
  },

  profileQrLarge: {
    width: 210,
    height: 210,
    alignSelf: "center",
    backgroundColor: C.white,
    borderRadius: R.md,
    marginVertical: 12,
  },

  tripPhotoImage: {
    width: "100%",
    height: "100%",
    borderRadius: R.md,
  },

  debtSummaryCard: {
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: R.lg,
    padding: 18,
    marginBottom: 18,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 3,
  },

  debtSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 15,
  },

  debtSummaryItem: {
    flex: 1,
  },

  debtAmount: {
    fontFamily: "Prompt_700Bold",
    fontSize: 19,
    marginTop: 3,
  },

  progressTrack: {
    height: 9,
    borderRadius: 999,
    backgroundColor: "#F1E5DE",
    overflow: "hidden",
  },

  progressValue: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: C.green,
  },

  progressCaption: {
    fontFamily: "Prompt_400Regular",
    fontSize: 11,
    color: C.textMuted,
    marginTop: 6,
  },

  debtTransferRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: C.borderLight,
    marginTop: 8,
  },

  debtTransferText: {
    flex: 1,
    fontFamily: "Prompt_500Medium",
    fontSize: 11,
    color: C.text,
  },

  debtTransferAction: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 11,
    color: C.pinkDark,
  },

  tripListImage: {
    width: "100%",
    height: "100%",
    borderRadius: R.sm,
  },

  settleTransferButton: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: C.greenLight,
  },

  settleTransferText: {
    fontFamily: "Prompt_600SemiBold",
    fontSize: 11,
    color: C.green,
  },

  loadingOverlay: {
    flex: 1,
    backgroundColor: "rgba(34,20,17,0.28)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  loadingCard: {
    width: 230,
    alignItems: "center",
    backgroundColor: C.white,
    borderRadius: R.lg,
    padding: 20,
  },
});

