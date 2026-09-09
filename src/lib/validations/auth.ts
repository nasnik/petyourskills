import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email({ message: "Invalid email address format." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }).optional(),
});

export const signUpSchema = z.object({
  callSign: z
    .string()
    .min(2, { message: "Call sign must be at least 2 characters." })
    .max(30, { message: "Call sign cannot exceed 30 characters." }),
  email: z.string().email({ message: "Invalid email address format." }),
  password: z
    .string()
    .min(8, { message: "Cipher key must be at least 8 characters long." }),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the Operative Terms of Service.",
  }),
});

export const onboardingSchema = z.object({
  selectedDomains: z
    .array(z.string())
    .min(1, { message: "Select at least 1 focus domain to initialize." }),
  companionAssignments: z.record(z.string(), z.string()),
  initialSkills: z.array(
    z.object({
      domainSlug: z.string(),
      title: z.string().min(2, { message: "Skill title too short." }),
      planningEngine: z.string().default("DAILY_ROUTINE"),
    })
  ),
});
