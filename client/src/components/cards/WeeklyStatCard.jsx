import React from "react";
import styled from "styled-components";
import { LineChart } from "@mui/x-charts/LineChart";

const Card = styled.div`
  flex: 1;
  min-width: 280px;
  padding: 24px;
  border: 1px solid ${({ theme }) => theme.text_primary + 20};
  border-radius: 14px;
  box-shadow: 1px 6px 20px 0px ${({ theme }) => theme.primary + 15};
  display: flex;
  flex-direction: column;
  gap: 6px;
  @media (max-width: 600px) {
    padding: 16px;
  }
`;

const Title = styled.div`
  font-weight: 600;
  font-size: 16px;
  color: ${({ theme }) => theme.primary};
`;

const Hint = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.text_secondary};
`;

const WeeklyStatCard = ({ data }) => {
  let weeks = data?.totalWeeksCaloriesBurnt?.weeks ?? [];
  let calories = data?.totalWeeksCaloriesBurnt?.caloriesBurned ?? [];

  // fallback data
  if (weeks.length === 0 || calories.length === 0) {
    const today = new Date();
    weeks = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    });
    calories = [0, 0, 0, 0, 0, 0, 0];
  }

  const aligned =
    weeks.length === calories.length
      ? calories
      : weeks.map((_, i) => calories[i] ?? 0);

  // ✅ Daily calories (NOT cumulative)
  const dailyCalories = aligned.map((v) => Number(v || 0));

  return (
    <Card>
      <Title>Daily calories burned</Title>

      {!data && <Hint>Loading chart…</Hint>}

      {data && dailyCalories.every((v) => v === 0) && (
        <Hint>No workouts logged in last 7 days.</Hint>
      )}

      <LineChart
        xAxis={[
          {
            scaleType: "band",
            data: weeks,
            label: "Day",
          },
        ]}
        yAxis={[{ label: "Calories burned (daily)" }]}
        series={[
          {
            data: dailyCalories, // ✅ FIXED HERE
            label: "Daily Burn",
            area: true,
            curve: "monotoneX",
          },
        ]}
        height={300}
        margin={{ left: 56, right: 16, top: 24, bottom: 40 }}
      />
    </Card>
  );
};

export default WeeklyStatCard;