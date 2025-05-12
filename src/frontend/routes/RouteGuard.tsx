import { Navigate, useLocation } from "react-router-dom";

interface RouteGuardProps {
  requiredCondition: boolean;
  redirectPath: string;
  children: React.ReactNode;
}

/**
 * A route guard that redirects to another path if a condition is not met
 */
const RouteGuard: React.FC<RouteGuardProps> = ({
  requiredCondition,
  redirectPath,
  children,
}) => {
  const location = useLocation();

  if (!requiredCondition) {
    // Redirect with the current location saved in state
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default RouteGuard;
