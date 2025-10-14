import { Badge } from '@/components/ui/badge'
import { Shield, ShieldCheck, Briefcase, Calculator, Eye } from 'lucide-react'

interface RoleBadgeProps {
  role: string
  showIcon?: boolean
}

const roleConfig: Record<string, { label: string; variant: any; icon: any; color: string }> = {
  super_admin: {
    label: 'Super Admin',
    variant: 'destructive',
    icon: ShieldCheck,
    color: 'text-red-600'
  },
  admin: {
    label: 'Admin',
    variant: 'default',
    icon: Shield,
    color: 'text-orange-600'
  },
  pm: {
    label: 'Project Manager',
    variant: 'default',
    icon: Briefcase,
    color: 'text-yellow-600'
  },
  contador: {
    label: 'Contador',
    variant: 'success',
    icon: Calculator,
    color: 'text-green-600'
  },
  viewer: {
    label: 'Viewer',
    variant: 'secondary',
    icon: Eye,
    color: 'text-blue-600'
  }
}

export default function RoleBadge({ role, showIcon = true }: RoleBadgeProps) {
  const config = roleConfig[role] || roleConfig.viewer
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  )
}

export function getRoleLabel(role: string): string {
  return roleConfig[role]?.label || 'Viewer'
}

export function getRoleColor(role: string): string {
  return roleConfig[role]?.color || 'text-gray-600'
}
