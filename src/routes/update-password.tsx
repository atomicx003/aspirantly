import { createFileRoute } from '@tanstack/react-router'
import { ForgotPassword } from '@/components/ForgotPassword'

export const Route = createFileRoute('/update-password')({
  component: ForgotPassword,
})
