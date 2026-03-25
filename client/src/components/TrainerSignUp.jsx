import React, { useState } from "react";
import styled from "styled-components";
import TextInput from "./TextInput";
import Button from "./Button";
import { TrainerSignUp } from "../api";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../redux/reducers/userSlice";

/* ✅ Wrapper (handles full page scroll) */
const Wrapper = styled.div`
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow-y: auto;
`;

/* ✅ Container (internal scroll if needed) */
const Container = styled.div`
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 24px;

  max-height: 90vh;
  overflow-y: auto;
  padding: 16px;
`;

const Title = styled.div`
  font-size: 30px;
  font-weight: 800;
  color: ${({ theme }) => theme.text_primary};
`;

const Span = styled.div`
  font-size: 16px;
  font-weight: 400;
  color: ${({ theme }) => theme.text_secondary + 90};
`;

const TrainerSignUpForm = () => {
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [bio, setBio] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [phone, setPhone] = useState("");
  const [certificationsRaw, setCertificationsRaw] = useState("");

  const validateInputs = () => {
    if (!name || !email || !password) {
      alert("Name, email, and password are required");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    setButtonDisabled(true);

    try {
      const certifications = certificationsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await TrainerSignUp({
        name,
        email,
        password,
        specialty,
        bio,
        yearsExperience: yearsExperience ? Number(yearsExperience) : 0,
        phone,
        certifications,
      });

      dispatch(loginSuccess(res.data));
      alert("Trainer account created ✅");
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Sign up failed");
    } finally {
      setLoading(false);
      setButtonDisabled(false);
    }
  };

  return (
    <Wrapper>
      <Container>
        <div>
          <Title>Create trainer account</Title>
          <Span>Register with your professional details</Span>
        </div>

        <div style={{ display: "flex", gap: "16px", flexDirection: "column" }}>
          <TextInput
            label="Full name"
            placeholder="Your name"
            value={name}
            handelChange={(e) => setName(e.target.value)}
          />

          <TextInput
            label="Email"
            placeholder="Email"
            value={email}
            handelChange={(e) => setEmail(e.target.value)}
          />

          <TextInput
            label="Password"
            placeholder="Password"
            password
            value={password}
            handelChange={(e) => setPassword(e.target.value)}
          />

          <TextInput
            label="Specialty"
            placeholder="e.g. Strength, HIIT, Yoga"
            value={specialty}
            handelChange={(e) => setSpecialty(e.target.value)}
          />

          <TextInput
            label="Bio"
            placeholder="Short bio"
            textArea
            rows={3}
            value={bio}
            handelChange={(e) => setBio(e.target.value)}
          />

          <TextInput
            label="Years of experience"
            placeholder="e.g. 5"
            value={yearsExperience}
            handelChange={(e) => setYearsExperience(e.target.value)}
          />

          <TextInput
            label="Phone"
            placeholder="Optional"
            value={phone}
            handelChange={(e) => setPhone(e.target.value)}
          />

          <TextInput
            label="Certifications"
            placeholder="Comma-separated (e.g. NASM CPT, CPR)"
            value={certificationsRaw}
            handelChange={(e) => setCertificationsRaw(e.target.value)}
          />

          <Button
            text="Create trainer account"
            onClick={handleSubmit}
            isLoading={loading}
            isDisabled={buttonDisabled}
          />
        </div>
      </Container>
    </Wrapper>
  );
};

export default TrainerSignUpForm;