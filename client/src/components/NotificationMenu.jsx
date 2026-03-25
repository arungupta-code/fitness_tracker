import React, { useEffect, useState, useCallback } from "react";
import {
  Badge,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import NotificationsNoneRounded from "@mui/icons-material/NotificationsNoneRounded";
import NotificationsActiveRounded from "@mui/icons-material/NotificationsActiveRounded";
import {
  getTrainerNotifications,
  getUserNotifications,
  markTrainerNotificationRead,
  markUserNotificationRead,
} from "../api";

export default function NotificationMenu({ role }) {
  const isTrainer = role === "trainer";
  const [anchorEl, setAnchorEl] = useState(null);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("fittrack-app-token")
      : null;

  const loadSummary = useCallback(async () => {
    if (!token) return;
    try {
      const res = isTrainer
        ? await getTrainerNotifications(token, true)
        : await getUserNotifications(token, true);
      setUnread(res.data?.unreadCount ?? 0);
    } catch (e) {
      /* ignore */
    }
  }, [isTrainer, token]);

  useEffect(() => {
    loadSummary();
    const interval = setInterval(loadSummary, 20000);
    return () => clearInterval(interval);
  }, [loadSummary]);

  const openMenu = async (e) => {
    setAnchorEl(e.currentTarget);
    if (!token) return;
    try {
      const res = isTrainer
        ? await getTrainerNotifications(token, false)
        : await getUserNotifications(token, false);
      setItems(res.data?.notifications ?? []);
      setUnread(res.data?.unreadCount ?? 0);
    } catch (err) {
      console.error(err);
    }
  };

  const closeMenu = () => {
    setAnchorEl(null);
  };

  const onSelectNotification = async (n) => {
    if (!token) return;
    try {
      if (!n.read) {
        if (isTrainer) {
          await markTrainerNotificationRead(token, n._id);
        } else {
          await markUserNotificationRead(token, n._id);
        }
      }
      await loadSummary();
      if (isTrainer) {
        window.dispatchEvent(new CustomEvent("trainer-refresh-bookings"));
      }
    } catch (e) {
      console.error(e);
    }
    closeMenu();
  };

  const open = Boolean(anchorEl);
  const Icon = unread > 0 ? NotificationsActiveRounded : NotificationsNoneRounded;

  return (
    <>
      <IconButton
        size="small"
        onClick={openMenu}
        aria-label="Notifications"
        sx={{ color: "inherit" }}
      >
        <Badge badgeContent={unread} color="error" max={99}>
          <Icon sx={{ fontSize: 26 }} />
        </Badge>
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={closeMenu}>
        {items.length === 0 ? (
          <MenuItem disabled>No notifications</MenuItem>
        ) : (
          items.map((n) => (
            <MenuItem
              key={n._id}
              onClick={() => onSelectNotification(n)}
              dense
              sx={{
                opacity: n.read ? 0.65 : 1,
                alignItems: "flex-start",
                maxWidth: 320,
              }}
            >
              <Box>
                <Typography variant="body2" fontWeight={700}>
                  {n.title}
                </Typography>
                <Typography variant="caption" display="block">
                  {n.body}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {n.createdAt
                    ? new Date(n.createdAt).toLocaleString()
                    : ""}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
}
