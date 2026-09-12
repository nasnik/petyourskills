import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import OnboardingWizard from "./page";
import { saveOnboardingAction } from "@/actions/auth";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock("@/actions/auth", () => ({
  saveOnboardingAction: jest.fn().mockResolvedValue({ success: true }),
}));

describe("OnboardingWizard Step 3: Define Skills multi-skill functionality", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete (window as any).location;
    window.location = new URL("http://localhost:3000/onboarding") as any;
  });

  const navigateToStep3 = () => {
    render(<OnboardingWizard />);
    // Step 1 -> Step 2
    const initButton = screen.getByRole("button", { name: /initialize core/i });
    fireEvent.click(initButton);

    // Step 2 -> Step 3
    const configSkillsButton = screen.getByRole("button", { name: /configure skills/i });
    fireEvent.click(configSkillsButton);
  };

  it("renders DEFINE SKILLS step with Add Skill / Project buttons for selected domains", () => {
    navigateToStep3();

    expect(
      screen.getByRole("heading", { name: /define skills & planning engine/i })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /add skill \/ project to work & projects/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add skill \/ project to health & wellness/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add skill \/ project to learning & growth/i })
    ).toBeInTheDocument();
  });

  it("adds a new skill to the domain when clicking Add Skill / Project", () => {
    navigateToStep3();

    const addWorkSkillButton = screen.getByRole("button", {
      name: /add skill \/ project to work & projects/i,
    });

    // Initially 1 skill for work, showing "Primary Skill"
    expect(screen.queryByText("Skill / Project #2")).not.toBeInTheDocument();

    // Click Add Skill
    fireEvent.click(addWorkSkillButton);

    // Now Skill / Project #2 should be visible
    expect(screen.getByText("Skill / Project #2")).toBeInTheDocument();

    // Multiple skills now exist, so Remove buttons should appear
    const removeButtons = screen.getAllByRole("button", { name: /remove/i });
    expect(removeButtons.length).toBeGreaterThan(0);
  });

  it("allows updating the title of added skills and removing an added skill", () => {
    navigateToStep3();

    const addWorkSkillButton = screen.getByRole("button", {
      name: /add skill \/ project to work & projects/i,
    });
    fireEvent.click(addWorkSkillButton);

    const inputs = screen.getAllByPlaceholderText(
      /e.g. Frontend Engineering, Marathon Training, Spanish Fluency.../i
    );
    // Change second skill title
    fireEvent.change(inputs[1], { target: { value: "Mobile Architecture Sprint" } });
    expect(inputs[1]).toHaveValue("Mobile Architecture Sprint");

    // Remove the added skill
    const removeButtons = screen.getAllByRole("button", { name: /remove/i });
    fireEvent.click(removeButtons[1]);

    // Skill / Project #2 should no longer exist
    expect(screen.queryByText("Skill / Project #2")).not.toBeInTheDocument();
  });

  it("submits all configured skills per domain on Launch Core System", async () => {
    navigateToStep3();

    const addWorkSkillButton = screen.getByRole("button", {
      name: /add skill \/ project to work & projects/i,
    });
    fireEvent.click(addWorkSkillButton);

    const launchButton = screen.getByRole("button", { name: /launch core system/i });
    fireEvent.click(launchButton);

    await waitFor(() => {
      expect(saveOnboardingAction).toHaveBeenCalledTimes(1);
    });

    const callPayload = (saveOnboardingAction as jest.Mock).mock.calls[0][0];
    expect(callPayload.selectedDomains).toContain("work");
    // Work should have 2 skills
    expect(callPayload.skills.work).toHaveLength(2);
    expect(callPayload.skills.health).toHaveLength(1);
    expect(callPayload.skills.learning).toHaveLength(1);
  });
});
