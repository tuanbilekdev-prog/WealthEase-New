'use client'

interface CustomAvatarSVGProps {
  avatarId: number
  size?: number
  className?: string
}

// Custom SVG Avatar Illustrations - Original Fintech Abstractions
export default function CustomAvatarSVG({ avatarId, size = 40, className = '' }: CustomAvatarSVGProps) {
  const viewBox = "0 0 100 100"
  
  // Each avatar is a unique custom-designed illustration
  // Use unique gradient IDs per avatar to avoid conflicts when multiple avatars are rendered
  const renderAvatar = () => {
    switch (avatarId) {
      case 1: // Growth Bars Pattern
        return (
          <g>
            <defs>
              <linearGradient id={`grad1-${avatarId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2ECC71" />
                <stop offset="100%" stopColor="#1E8449" />
              </linearGradient>
            </defs>
            <rect x="25" y="60" width="12" height="25" rx="3" fill={`url(#grad1-${avatarId})`} />
            <rect x="42" y="50" width="12" height="35" rx="3" fill={`url(#grad1-${avatarId})`} />
            <rect x="59" y="40" width="12" height="45" rx="3" fill={`url(#grad1-${avatarId})`} />
            <circle cx="70" cy="35" r="4" fill="#E8F8F5" />
          </g>
        )
      
      case 2: // Ascending Wave Pattern
        return (
          <g>
            <defs>
              <linearGradient id={`grad2-${avatarId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3498DB" />
                <stop offset="100%" stopColor="#2ECC71" />
              </linearGradient>
            </defs>
            <path d="M 20 70 Q 35 50, 50 60 T 80 50" stroke={`url(#grad2-${avatarId})`} strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M 25 75 Q 40 55, 55 65 T 85 55" stroke={`url(#grad2-${avatarId})`} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6" />
            <circle cx="80" cy="50" r="3" fill="#2ECC71" />
          </g>
        )
      
      case 3: // Network Nodes
        return (
          <g>
            <circle cx="35" cy="35" r="8" fill="#2ECC71" />
            <circle cx="65" cy="35" r="8" fill="#27AE60" />
            <circle cx="50" cy="65" r="8" fill="#1E8449" />
            <line x1="40" y1="38" x2="58" y2="38" stroke="#2ECC71" strokeWidth="2" />
            <line x1="42" y1="42" x2="52" y2="59" stroke="#2ECC71" strokeWidth="2" />
            <line x1="58" y1="42" x2="52" y2="59" stroke="#2ECC71" strokeWidth="2" />
          </g>
        )
      
      case 4: // Concentric Circles (Stability)
        return (
          <g>
            <circle cx="50" cy="50" r="35" fill="none" stroke="#2ECC71" strokeWidth="2" opacity="0.3" />
            <circle cx="50" cy="50" r="25" fill="none" stroke="#2ECC71" strokeWidth="2.5" opacity="0.5" />
            <circle cx="50" cy="50" r="15" fill="#2ECC71" opacity="0.8" />
            <circle cx="50" cy="50" r="8" fill="#E8F8F5" />
          </g>
        )
      
      case 5: // Grid Pattern
        return (
          <g>
            <defs>
              <linearGradient id={`grad5-${avatarId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#16A085" />
                <stop offset="100%" stopColor="#2ECC71" />
              </linearGradient>
            </defs>
            <rect x="25" y="30" width="15" height="15" rx="2" fill={`url(#grad5-${avatarId})`} />
            <rect x="45" y="30" width="15" height="15" rx="2" fill={`url(#grad5-${avatarId})`} opacity="0.7" />
            <rect x="60" y="30" width="15" height="15" rx="2" fill={`url(#grad5-${avatarId})`} opacity="0.5" />
            <rect x="25" y="50" width="15" height="15" rx="2" fill={`url(#grad5-${avatarId})`} opacity="0.8" />
            <rect x="45" y="50" width="15" height="15" rx="2" fill={`url(#grad5-${avatarId})`} opacity="0.9" />
            <rect x="60" y="50" width="15" height="15" rx="2" fill={`url(#grad5-${avatarId})`} opacity="0.6" />
          </g>
        )
      
      case 6: // Diagonal Lines (Growth)
        return (
          <g>
            <defs>
              <linearGradient id={`grad6-${avatarId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#27AE60" />
                <stop offset="100%" stopColor="#2ECC71" />
              </linearGradient>
            </defs>
            <line x1="25" y1="70" x2="40" y2="30" stroke={`url(#grad6-${avatarId})`} strokeWidth="4" strokeLinecap="round" />
            <line x1="35" y1="70" x2="50" y2="30" stroke={`url(#grad6-${avatarId})`} strokeWidth="4" strokeLinecap="round" />
            <line x1="45" y1="70" x2="60" y2="30" stroke={`url(#grad6-${avatarId})`} strokeWidth="4" strokeLinecap="round" />
            <line x1="55" y1="70" x2="70" y2="30" stroke={`url(#grad6-${avatarId})`} strokeWidth="4" strokeLinecap="round" />
          </g>
        )
      
      case 7: // Hexagon Pattern
        return (
          <g>
            <defs>
              <linearGradient id={`grad7-${avatarId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2ECC71" />
                <stop offset="100%" stopColor="#16A085" />
              </linearGradient>
            </defs>
            <polygon points="50,20 65,30 65,50 50,60 35,50 35,30" fill={`url(#grad7-${avatarId})`} />
            <polygon points="50,40 58,45 58,55 50,60 42,55 42,45" fill="#E8F8F5" opacity="0.8" />
          </g>
        )
      
      case 8: // Diamond Stack
        return (
          <g>
            <polygon points="50,25 60,35 50,45 40,35" fill="#2ECC71" />
            <polygon points="50,40 58,47 50,54 42,47" fill="#27AE60" opacity="0.8" />
            <polygon points="50,52 55,57 50,62 45,57" fill="#1E8449" opacity="0.7" />
          </g>
        )
      
      case 9: // Pillar Structure
        return (
          <g>
            <rect x="30" y="35" width="10" height="40" rx="5" fill="#2ECC71" />
            <rect x="45" y="30" width="10" height="45" rx="5" fill="#27AE60" />
            <rect x="60" y="40" width="10" height="35" rx="5" fill="#2ECC71" opacity="0.8" />
            <line x1="35" y1="35" x2="50" y2="30" stroke="#E8F8F5" strokeWidth="2" />
            <line x1="50" y1="30" x2="65" y2="40" stroke="#E8F8F5" strokeWidth="2" />
          </g>
        )
      
      case 10: // Abstract Flow
        return (
          <g>
            <defs>
              <linearGradient id={`grad10-${avatarId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3498DB" />
                <stop offset="50%" stopColor="#2ECC71" />
                <stop offset="100%" stopColor="#16A085" />
              </linearGradient>
            </defs>
            <path d="M 30 50 Q 40 35, 50 40 T 70 45" stroke={`url(#grad10-${avatarId})`} strokeWidth="3" fill="none" />
            <circle cx="30" cy="50" r="4" fill="#3498DB" />
            <circle cx="50" cy="40" r="5" fill="#2ECC71" />
            <circle cx="70" cy="45" r="4" fill="#16A085" />
          </g>
        )
      
      case 11: // Rising Bars (Growth)
        return (
          <g>
            <rect x="25" y="65" width="8" height="20" rx="2" fill="#2ECC71" />
            <rect x="37" y="58" width="8" height="27" rx="2" fill="#2ECC71" opacity="0.9" />
            <rect x="49" y="50" width="8" height="35" rx="2" fill="#2ECC71" opacity="0.95" />
            <rect x="61" y="42" width="8" height="43" rx="2" fill="#2ECC71" />
            <circle cx="65" cy="38" r="3" fill="#E8F8F5" />
          </g>
        )
      
      case 12: // Bar Chart Abstract
        return (
          <g>
            <rect x="20" y="55" width="10" height="30" rx="2" fill="#2ECC71" />
            <rect x="35" y="45" width="10" height="40" rx="2" fill="#27AE60" />
            <rect x="50" y="50" width="10" height="35" rx="2" fill="#2ECC71" opacity="0.9" />
            <rect x="65" y="40" width="10" height="45" rx="2" fill="#1E8449" />
            <line x1="25" y1="50" x2="70" y2="35" stroke="#E8F8F5" strokeWidth="2" strokeDasharray="2 2" />
          </g>
        )
      
      case 13: // Descending Stabilization
        return (
          <g>
            <rect x="25" y="40" width="10" height="35" rx="2" fill="#3498DB" />
            <rect x="40" y="48" width="10" height="27" rx="2" fill="#3498DB" opacity="0.8" />
            <rect x="55" y="52" width="10" height="23" rx="2" fill="#3498DB" opacity="0.9" />
            <line x1="30" y1="52" x2="60" y2="58" stroke="#E8F8F5" strokeWidth="2" />
          </g>
        )
      
      case 14: // Circular Flow
        return (
          <g>
            <defs>
              <linearGradient id={`grad14-${avatarId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3498DB" />
                <stop offset="100%" stopColor="#2ECC71" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="30" fill="none" stroke={`url(#grad14-${avatarId})`} strokeWidth="3" strokeDasharray="5 5" />
            <circle cx="50" cy="50" r="20" fill="none" stroke={`url(#grad14-${avatarId})`} strokeWidth="2" strokeDasharray="3 3" />
            <circle cx="50" cy="50" r="10" fill={`url(#grad14-${avatarId})`} />
          </g>
        )
      
      case 15: // Coin Stack
        return (
          <g>
            <circle cx="50" cy="45" r="12" fill="#F39C12" />
            <circle cx="50" cy="45" r="8" fill="#E8F8F5" />
            <circle cx="50" cy="58" r="10" fill="#F39C12" opacity="0.8" />
            <circle cx="50" cy="58" r="6" fill="#E8F8F5" />
            <circle cx="50" cy="68" r="8" fill="#F39C12" opacity="0.6" />
          </g>
        )
      
      case 16: // Dot Matrix Growth
        return (
          <g>
            <circle cx="30" cy="60" r="4" fill="#2ECC71" />
            <circle cx="45" cy="55" r="4" fill="#2ECC71" />
            <circle cx="55" cy="48" r="5" fill="#2ECC71" />
            <circle cx="65" cy="42" r="4" fill="#2ECC71" />
            <line x1="34" y1="58" x2="41" y2="56" stroke="#2ECC71" strokeWidth="2" />
            <line x1="49" y1="53" x2="51" y2="50" stroke="#2ECC71" strokeWidth="2" />
            <line x1="59" y1="46" x2="61" y2="44" stroke="#2ECC71" strokeWidth="2" />
          </g>
        )
      
      case 17: // Refresh Cycle
        return (
          <g>
            <defs>
              <linearGradient id={`grad17-${avatarId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2ECC71" />
                <stop offset="100%" stopColor="#16A085" />
              </linearGradient>
            </defs>
            <path d="M 50 30 Q 70 30, 70 50 Q 70 70, 50 70" stroke={`url(#grad17-${avatarId})`} strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M 50 70 Q 30 70, 30 50 Q 30 30, 50 30" stroke={`url(#grad17-${avatarId})`} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5" />
            <circle cx="70" cy="50" r="4" fill="#2ECC71" />
            <circle cx="50" cy="30" r="4" fill="#16A085" />
          </g>
        )
      
      case 18: // Ascending Dots
        return (
          <g>
            <circle cx="35" cy="65" r="5" fill="#2ECC71" />
            <circle cx="50" cy="55" r="6" fill="#27AE60" />
            <circle cx="65" cy="45" r="5" fill="#2ECC71" />
            <line x1="40" y1="63" x2="44" y2="57" stroke="#2ECC71" strokeWidth="2" strokeDasharray="2 2" />
            <line x1="56" y1="53" x2="60" y2="47" stroke="#27AE60" strokeWidth="2" strokeDasharray="2 2" />
          </g>
        )
      
      case 19: // Calendar Grid
        return (
          <g>
            <rect x="25" y="30" width="50" height="45" rx="3" fill="none" stroke="#2ECC71" strokeWidth="2.5" />
            <line x1="50" y1="30" x2="50" y2="75" stroke="#2ECC71" strokeWidth="2" />
            <line x1="25" y1="45" x2="75" y2="45" stroke="#2ECC71" strokeWidth="2" />
            <rect x="30" y="50" width="15" height="15" rx="1" fill="#2ECC71" opacity="0.3" />
            <rect x="55" y="50" width="15" height="15" rx="1" fill="#27AE60" opacity="0.4" />
          </g>
        )
      
      case 20: // Building Blocks
        return (
          <g>
            <rect x="30" y="55" width="18" height="20" rx="2" fill="#3498DB" />
            <rect x="52" y="50" width="18" height="25" rx="2" fill="#2ECC71" />
            <rect x="35" y="40" width="12" height="15" rx="1" fill="#3498DB" opacity="0.8" />
            <rect x="57" y="35" width="12" height="15" rx="1" fill="#2ECC71" opacity="0.8" />
          </g>
        )
      
      case 21: // Target Focus
        return (
          <g>
            <circle cx="50" cy="50" r="25" fill="none" stroke="#E74C3C" strokeWidth="2" />
            <circle cx="50" cy="50" r="18" fill="none" stroke="#E74C3C" strokeWidth="2" />
            <circle cx="50" cy="50" r="11" fill="#E74C3C" opacity="0.8" />
            <circle cx="50" cy="50" r="6" fill="#E8F8F5" />
          </g>
        )
      
      case 22: // Balance Scale
        return (
          <g>
            <line x1="30" y1="55" x2="70" y2="55" stroke="#2ECC71" strokeWidth="3" strokeLinecap="round" />
            <line x1="50" y1="35" x2="50" y2="55" stroke="#2ECC71" strokeWidth="3" />
            <circle cx="35" cy="65" r="8" fill="#27AE60" />
            <circle cx="65" cy="65" r="8" fill="#27AE60" />
          </g>
        )
      
      case 23: // Document Grid
        return (
          <g>
            <rect x="30" y="35" width="20" height="30" rx="2" fill="none" stroke="#2ECC71" strokeWidth="2" />
            <line x1="35" y1="45" x2="45" y2="45" stroke="#2ECC71" strokeWidth="1.5" />
            <line x1="35" y1="52" x2="45" y2="52" stroke="#2ECC71" strokeWidth="1.5" />
            <line x1="35" y1="59" x2="40" y2="59" stroke="#2ECC71" strokeWidth="1.5" />
            <rect x="55" y="40" width="15" height="25" rx="2" fill="#27AE60" opacity="0.2" />
          </g>
        )
      
      case 24: // Checkmark Success
        return (
          <g>
            <circle cx="50" cy="50" r="25" fill="#2ECC71" />
            <path d="M 35 50 L 45 60 L 65 40" stroke="#E8F8F5" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )
      
      default:
        return (
          <g>
            <circle cx="50" cy="50" r="30" fill="#2ECC71" opacity="0.3" />
            <circle cx="50" cy="50" r="20" fill="#2ECC71" opacity="0.5" />
            <circle cx="50" cy="50" r="10" fill="#2ECC71" />
          </g>
        )
    }
  }

  return (
    <svg
      viewBox={viewBox}
      width={size}
      height={size}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      style={{ pointerEvents: 'none' }}
    >
      {renderAvatar()}
    </svg>
  )
}

