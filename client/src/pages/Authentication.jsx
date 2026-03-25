
import React, { useState } from "react";
import styled from "styled-components";
import LogoImage from "../utils/Images/Logo.png";
import AuthImage from "../utils/Images/AuthImage.jpg";
import SignIn from "../components/SignIn";
import SignUp from "../components/SignUp";
import TrainerSignInForm from "../components/TrainerSignIn";
import TrainerSignUpForm from "../components/TrainerSignUp";

const Container = styled.div`
  flex: 1;
  height: 100%;
  display: flex;
  background: ${({ theme }) => theme.bg};
  @media (max-width: 700px) {
    flex-direction: column;
  }
`;
const Left = styled.div`
  flex: 1;
  position: relative;
  @media (max-width: 700px) {
    display: none;
  }
`;
const Logo = styled.img`
  position: absolute;
  width: 70px;
  top: 40px;
  left: 60px;
  z-index: 10;
`;
const Image = styled.img`
  position: relative;
  height: 100%;
  width: 100%;
  object-fit: cover;
`;

const Right = styled.div`
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 40px;
  gap: 16px;
  align-items: center;
  justify-content: center;
`;

const Text = styled.div`
  font-size: 16px;
  text-align: center;
  color: ${({ theme }) => theme.text_secondary};
  margin-top: 16px;
  @media (max-width: 400px) {
    font-size: 14px;
  }
`;
const TextButton = styled.span`
  color: ${({ theme }) => theme.primary};
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
`;

const ToggleRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
  justify-content: center;
`;

const ToggleButton = styled.button`
  padding: 10px 18px;
  border-radius: 10px;
  border: 1px solid
    ${({ theme, $active }) => ($active ? theme.primary : theme.text_secondary + 60)};
  background: ${({ theme, $active }) =>
    $active ? theme.primary + 25 : "transparent"};
  color: ${({ theme, $active }) => ($active ? theme.primary : theme.text_primary)};
  font-weight: 600;
  cursor: pointer;
  font-size: 14px;
`;

const Authentication = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [accountType, setAccountType] = useState("member");

  return (
    <Container>
      <Left>
        <Logo src={LogoImage} />
        <Image src={AuthImage} />
      </Left>
      <Right>
        <ToggleRow>
          <ToggleButton
            type="button"
            $active={accountType === "member"}
            onClick={() => setAccountType("member")}
          >
            Member
          </ToggleButton>
          <ToggleButton
            type="button"
            $active={accountType === "trainer"}
            onClick={() => setAccountType("trainer")}
          >
            Trainer
          </ToggleButton>
        </ToggleRow>

        {accountType === "member" ? (
          <>
            {!isRegister ? (
              <>
                <SignIn />
                <Text>
                  Don&apos;t have an account?{" "}
                  <TextButton onClick={() => setIsRegister(true)}>
                    SignUp
                  </TextButton>
                </Text>
              </>
            ) : (
              <>
                <SignUp />
                <Text>
                  Already have an account?{" "}
                  <TextButton onClick={() => setIsRegister(false)}>
                    SignIn
                  </TextButton>
                </Text>
              </>
            )}
          </>
        ) : (
          <>
            {!isRegister ? (
              <>
                <TrainerSignInForm />
                <Text>
                  New trainer?{" "}
                  <TextButton onClick={() => setIsRegister(true)}>
                    Create account
                  </TextButton>
                </Text>
              </>
            ) : (
              <>
                <TrainerSignUpForm />
                <Text>
                  Already registered?{" "}
                  <TextButton onClick={() => setIsRegister(false)}>
                    Sign in
                  </TextButton>
                </Text>
              </>
            )}
          </>
        )}
      </Right>
    </Container>
  );
};

export default Authentication;
