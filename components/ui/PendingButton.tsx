"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { useFormStatus } from 'react-dom'

type PendingButtonProps = React.ComponentProps<typeof Button>

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  )
}

export default function PendingButton(props: PendingButtonProps) {
  const { pending } = useFormStatus()
  const { children, disabled, className, ...rest } = props

  return (
    <Button
      {...rest}
      className={className}
      aria-busy={pending}
      disabled={pending || disabled}
    >
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <Spinner />
          <span>Processing...</span>
        </span>
      ) : (
        children
      )}
    </Button>
  )
}


