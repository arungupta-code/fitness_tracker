import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import {
  acceptTrainerBooking,
  getTrainerBookings,
  rejectTrainerBooking,
  trainerEndSession,
} from "../api";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Tab,
  Tabs,
} from "@mui/material";

const Container = styled.div`
  flex: 1;
  height: 100%;
  display: flex;
  justify-content: center;
  padding: 22px 16px;
  overflow-y: auto;
`;
const Wrapper = styled.div`
  flex: 1;
  max-width: 900px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;
const Title = styled.h1`
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: ${({ theme }) => theme.text_primary};
`;
const Sub = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.text_secondary};
  font-size: 15px;
`;
const Card = styled.div`
  padding: 18px 20px;
  border: 1px solid ${({ theme }) => theme.text_primary + 20};
  border-radius: 14px;
  box-shadow: 1px 6px 20px 0px ${({ theme }) => theme.primary + 12};
  display: flex;
  flex-direction: column;
  gap: 10px;
`;
const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
  align-items: center;
`;
const Muted = styled.span`
  color: ${({ theme }) => theme.text_secondary};
  font-size: 14px;
`;

const statusColor = (s) => {
  switch (s) {
    case "pending":
      return "warning";
    case "confirmed":
      return "success";
    case "completed":
      return "default";
    case "rejected":
      return "error";
    default:
      return "default";
  }
};

const TrainerDashboard = () => {
  const [tab, setTab] = useState(0);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const token = localStorage.getItem("fittrack-app-token");
  const scope = tab === 0 ? "active" : "history";

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getTrainerBookings(token, scope);
      setBookings(res.data?.bookings ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token, scope]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const fn = () => load();
    window.addEventListener("trainer-refresh-bookings", fn);
    return () => window.removeEventListener("trainer-refresh-bookings", fn);
  }, [load]);

  const runAction = async (id, fn) => {
    setBusyId(id);
    try {
      await fn(token, id);
      await load();
    } catch (e) {
      alert(e.response?.data?.message || e.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  if (loading && bookings.length === 0) {
    return (
      <Container>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container>
      <Wrapper>
        <div>
          <Title>Trainer dashboard</Title>
          <Sub>
            Use the bell (🔔) to open new requests. Accept or reject pending
            sessions; end sessions when finished — they move to history for you
            and the member.
          </Sub>
        </div>

        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Active" />
          <Tab label="History" />
        </Tabs>

        {loading ? (
          <CircularProgress size={28} />
        ) : bookings.length === 0 ? (
          <Muted>
            {tab === 0
              ? "No active sessions. New requests appear after a member books you."
              : "No past sessions yet."}
          </Muted>
        ) : (
          bookings.map((b) => (
            <Card key={b._id}>
              <Row>
                <strong>{b.user?.name ?? "Member"}</strong>
                <Chip
                  size="small"
                  label={b.status}
                  color={statusColor(b.status)}
                  variant="outlined"
                />
              </Row>
              <Muted>{b.user?.email}</Muted>
              <div>
                {new Date(b.scheduledAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </div>
              {b.notes ? <Muted>Notes: {b.notes}</Muted> : null}
              {b.status === "completed" && b.endedBy ? (
                <Muted>Ended by: {b.endedBy}</Muted>
              ) : null}

              {tab === 0 && b.status === "pending" ? (
                <Box display="flex" gap={1} flexWrap="wrap">
                  <Button
                    size="small"
                    variant="contained"
                    disabled={busyId === b._id}
                    onClick={() =>
                      runAction(b._id, acceptTrainerBooking)
                    }
                  >
                    Accept
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    disabled={busyId === b._id}
                    onClick={() =>
                      runAction(b._id, rejectTrainerBooking)
                    }
                  >
                    Reject
                  </Button>
                </Box>
              ) : null}

              {tab === 0 && b.status === "confirmed" ? (
                <Button
                  size="small"
                  variant="contained"
                  color="secondary"
                  disabled={busyId === b._id}
                  onClick={() => runAction(b._id, trainerEndSession)}
                >
                  End session
                </Button>
              ) : null}
            </Card>
          ))
        )}
      </Wrapper>
    </Container>
  );
};

export default TrainerDashboard;
