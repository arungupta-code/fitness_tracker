import React, { useEffect, useState } from "react";
import styled from "styled-components";
import WorkoutCard from "../components/cards/WorkoutCard";
import { getUserBookings, getWorkoutHistory, userEndSession } from "../api";
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
  max-width: 1400px;
  display: flex;
  flex-direction: column;
  gap: 18px;
`;
const Title = styled.h1`
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: ${({ theme }) => theme.text_primary};
`;
const Grid = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
  margin-bottom: 40px;
`;
const SessionCard = styled.div`
  flex: 1;
  min-width: 260px;
  max-width: 400px;
  padding: 16px 18px;
  border: 1px solid ${({ theme }) => theme.text_primary + 20};
  border-radius: 14px;
  box-shadow: 1px 6px 20px 0px ${({ theme }) => theme.primary + 12};
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
const Muted = styled.div`
  color: ${({ theme }) => theme.text_secondary};
  font-size: 14px;
`;

const sessionStatusColor = (s) => {
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

const History = () => {
  const [mainTab, setMainTab] = useState(0);
  const [sessionTab, setSessionTab] = useState(0);
  const [workouts, setWorkouts] = useState([]);
  const [sessionActive, setSessionActive] = useState([]);
  const [sessionPast, setSessionPast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const token = localStorage.getItem("fittrack-app-token");

  useEffect(() => {
    if (mainTab !== 0) return;
    setLoading(true);
    getWorkoutHistory(token)
      .then((res) => setWorkouts(res.data?.workouts ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [mainTab, token]);

  useEffect(() => {
    if (mainTab !== 1) return;
    setLoadingSessions(true);
    const scope = sessionTab === 0 ? "active" : "history";
    getUserBookings(token, scope)
      .then((res) => {
        const list = res.data?.bookings ?? [];
        if (sessionTab === 0) setSessionActive(list);
        else setSessionPast(list);
      })
      .catch(console.error)
      .finally(() => setLoadingSessions(false));
  }, [mainTab, sessionTab, token]);

  const endSession = async (id) => {
    setBusyId(id);
    try {
      await userEndSession(token, id);
      const res = await getUserBookings(token, "active");
      setSessionActive(res.data?.bookings ?? []);
      const past = await getUserBookings(token, "history");
      setSessionPast(past.data?.bookings ?? []);
    } catch (e) {
      alert(e.response?.data?.message || e.message || "Could not end session");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Container>
      <Wrapper>
        <Title>History</Title>
        <Tabs value={mainTab} onChange={(_, v) => setMainTab(v)}>
          <Tab label="Workouts" />
          <Tab label="Sessions" />
        </Tabs>

        {mainTab === 0 && (
          <>
            {loading ? (
              <CircularProgress />
            ) : workouts.length === 0 ? (
              <p style={{ color: "#888" }}>No logged workouts yet.</p>
            ) : (
              <Grid>
                {workouts.map((w) => (
                  <div key={w._id}>
                    <WorkoutCard workout={w} showMeta />
                  </div>
                ))}
              </Grid>
            )}
          </>
        )}

        {mainTab === 1 && (
          <>
            <Tabs
              value={sessionTab}
              onChange={(_, v) => setSessionTab(v)}
              sx={{ borderBottom: 1, borderColor: "divider" }}
            >
              <Tab label="Active" />
              <Tab label="Past" />
            </Tabs>

            {loadingSessions ? (
              <CircularProgress size={28} />
            ) : (
              <Grid>
                {(sessionTab === 0 ? sessionActive : sessionPast).map(
                  (b) => (
                    <SessionCard key={b._id}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        gap={1}
                      >
                        <strong>
                          {b.trainer?.name ?? "Trainer"}
                        </strong>
                        <Chip
                          size="small"
                          label={b.status}
                          color={sessionStatusColor(b.status)}
                          variant="outlined"
                        />
                      </Box>
                      <Muted>
                        {new Date(b.scheduledAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </Muted>
                      {b.notes ? <Muted>Notes: {b.notes}</Muted> : null}
                      {b.status === "completed" && b.endedBy ? (
                        <Muted>Ended by: {b.endedBy}</Muted>
                      ) : null}
                      {sessionTab === 0 && b.status === "confirmed" ? (
                        <Button
                          size="small"
                          variant="contained"
                          disabled={busyId === b._id}
                          onClick={() => endSession(b._id)}
                        >
                          End session
                        </Button>
                      ) : null}
                    </SessionCard>
                  )
                )}
              </Grid>
            )}
            {!loadingSessions &&
              (sessionTab === 0 ? sessionActive : sessionPast).length ===
                0 && (
                <Muted>
                  {sessionTab === 0
                    ? "No active bookings. Book a session from the menu."
                    : "No past sessions yet."}
                </Muted>
              )}
          </>
        )}
      </Wrapper>
    </Container>
  );
};

export default History;
