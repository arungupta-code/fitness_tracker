import React, { useEffect, useState } from "react";
import styled from "styled-components";
import TextInput from "../components/TextInput";
import Button from "../components/Button";
import { createBooking, listPublicTrainers } from "../api";
import { MenuItem, Select, FormControl, InputLabel } from "@mui/material";

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
  max-width: 520px;
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
`;

const DateRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const DateLabel = styled.label`
  font-size: 12px;
  color: ${({ theme }) => theme.text_primary};
  padding: 0 4px;
`;

const DateInput = styled.input`
  border-radius: 8px;
  border: 0.5px solid ${({ theme }) => theme.text_secondary};
  background: transparent;
  color: ${({ theme }) => theme.text_primary};
  padding: 14px 16px;
  font-size: 15px;
  outline: none;
  &:focus {
    border-color: ${({ theme }) => theme.secondary};
  }
`;

const BookSession = () => {
  const [trainers, setTrainers] = useState([]);
  const [trainerId, setTrainerId] = useState("");
  const [datetime, setDatetime] = useState("");
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState(""); // ✅ search state

  const [loading, setLoading] = useState(false);
  const [btnDisabled, setBtnDisabled] = useState(false);

  useEffect(() => {
    listPublicTrainers()
      .then((res) => setTrainers(res.data?.trainers ?? []))
      .catch(console.error);
  }, []);

  // ✅ Filter logic (name + specialty)
  const filteredTrainers = trainers.filter((t) =>
    `${t.name} ${t.specialty || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const submit = async () => {
    if (!trainerId) {
      alert("Please select a trainer so they receive your request.");
      return;
    }
    if (!datetime) {
      alert("Please choose date and time");
      return;
    }

    setLoading(true);
    setBtnDisabled(true);

    const token = localStorage.getItem("fittrack-app-token");

    try {
      await createBooking(token, {
        scheduledAt: new Date(datetime).toISOString(),
        notes,
        trainerId,
      });

      alert("Session requested ✅");
      setNotes("");
      setTrainerId("");
      setDatetime("");
    } catch (e) {
      alert(e.response?.data?.message || e.message || "Could not book");
    } finally {
      setLoading(false);
      setBtnDisabled(false);
    }
  };

  return (
    <Container>
      <Wrapper>
        <div>
          <Title>Book a session</Title>
          <Sub>Pick a trainer, time, and add any notes.</Sub>
        </div>

        {/* 🔍 Search Input */}
        <TextInput
          label="Search Trainer"
          placeholder="Search by name or specialty (e.g. Yoga)"
          value={search}
          handelChange={(e) => setSearch(e.target.value)}
        />

        {/* 👇 Trainer Dropdown */}
        <FormControl fullWidth size="small" required>
          <InputLabel id="trainer-label">Trainer (required)</InputLabel>
          <Select
            labelId="trainer-label"
            label="Trainer (required)"
            value={trainerId}
            onChange={(e) => setTrainerId(e.target.value)}
          >
            <MenuItem value="" disabled>
              <em>Select a trainer</em>
            </MenuItem>

            {filteredTrainers.length > 0 ? (
              filteredTrainers.map((t) => (
                <MenuItem key={t._id} value={t._id}>
                  {t.name}
                  {t.specialty ? ` — ${t.specialty}` : ""}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>No trainers found</MenuItem>
            )}
          </Select>
        </FormControl>

        {/* 📅 Date & Time */}
        <DateRow>
          <DateLabel>Date &amp; time</DateLabel>
          <DateInput
            type="datetime-local"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
          />
        </DateRow>

        {/* 📝 Notes */}
        <TextInput
          label="Notes"
          placeholder="Goals, injuries, etc."
          textArea
          rows={4}
          value={notes}
          handelChange={(e) => setNotes(e.target.value)}
        />

        {/* 🚀 Button */}
        <Button
          text="Request booking"
          onClick={submit}
          isLoading={loading}
          isDisabled={btnDisabled}
          full
        />
      </Wrapper>
    </Container>
  );
};

export default BookSession;