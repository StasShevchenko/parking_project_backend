import { SetMetadata } from '@nestjs/common';
import {Role} from "../../user/role";

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
