import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm"
import { Request } from "./Request"

@Entity()
export class Software {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @Column("text")
  description: string

  @Column("simple-array")
  accessLevels: string[] // ["Read", "Write", "Admin"]

  @OneToMany(
    () => Request,
    (request) => request.software,
  )
  requests: Request[]
}
