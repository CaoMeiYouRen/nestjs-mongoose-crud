import { Test } from "@nestjs/testing";
import * as mongoose from "mongoose";
import { INestApplication, Controller } from "@nestjs/common";
import * as request from "supertest";
import { Crud } from "./crud.decorator";

const DB = process.env.DB || "mongodb://localhost/nestjs-mongoose-crud-test-e2e";
mongoose.connect(DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
});

const UserModel = mongoose.model(
  "User",
  new mongoose.Schema(
    {
      username: String,
      age: Number
    },
    {
      timestamps: true
    }
  )
);

describe("CrudController e2e", () => {
  @Crud({
    model: UserModel,
    
  })
  @Controller('/users')
  class UserController {
    private model;
    constructor() {
      this.model = UserModel;
    }
  }
  let app: INestApplication;
  let server: any
  let totalUsers = 57

  beforeAll(async () => {
    await UserModel.deleteMany({});
    const users = Array(totalUsers)
      .fill(1)
      .map((v, i) => ({
        username: `user${i}`,
        age: Math.floor(Math.random() * 100)
      }));
    await UserModel.insertMany(users as any[]);
    const moduleRef = await Test.createTestingModule({
      controllers: [UserController]
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    server = app.getHttpServer()
  });
  afterAll(() => {
    mongoose.disconnect();
  });
  describe("create", () => {
    it('should create a user', async () => {
      return request(server)
      .post('/users')
      .send({username: `test1`})
      .expect(res => expect(res.body).toHaveProperty('_id'))
    })
    it("should return paginated users", async () => {
      return request(server)
      .get(`/users?query={"limit":8}`)
      .expect(200)
      .expect(res => expect(res.body.data.length).toBe(8))
    });

    // end of it()
  });
});
