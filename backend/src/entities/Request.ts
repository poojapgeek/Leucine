import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm"
import { User } from "./User"
import { Software } from "./Software"

@Entity()
export class Request {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(
    () => User,
    (user) => user.requests,
  )
  user: User

  @ManyToOne(
    () => Software,
    (software) => software.requests,
  )
  software: Software

  @Column({
    type: "enum",
    enum: ["Read", "Write", "Admin"],
  })
  accessType: "Read" | "Write" | "Admin"

  @Column("text")
  reason: string

  @Column({
    type: "enum",
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  })
  status: "Pending" | "Approved" | "Rejected"

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
