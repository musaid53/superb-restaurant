# Restaurant Application


## My First NodeJs Project
Yes, this is my first NodeJs project. So while coding this project, I had the most difficulty in the learning part. Because I've never done a project with NodeJs before. That's why I spent more time on google than developing. I don't know how to separate service layer and controller. Also, do I need to create a different class for dto objects? Being a functional language gives you a lot of flexibility, but coding in more complex ways was also inevitable for me.

If I was coding in java, I would create an api-gw, and create separate microservices for both systems. But now coding for other system scares me a bit. Because I haven't been able to write the tests of the first system yet and I need to separate the layers and services to make it more readable.

## TODOS
Generally; add postman collection(done), dockerize services(done), improve documentation(half done)
### Booking manager :
- Tests (done)
- Add documentation (done)
- Clean the code and refactor (done)
- Consider the layers (done)

### Restaurant booking :
- develop the system according to requirements
- All of the above

## Application Installation And Run
### Requirements
Make sure you have the latest Docker and docker-compose installed. For tests you need node js and npm
### Setup
Clone the repository:
```
git clone https://github.com/musaid53/superb-restaurant.git
```
Install dependencies:
```
npm install
```

### Quickstart  the Application
```
docker-compose up --build 
```
### Test
```
 npm run test
```

## Notes 
A postman collection added to make easier to request apis. You can directly use this postman collection with importing it. 

If you want to update a reservation use the same api with reserve (POST /reserve)
and add "reservationId"  to body. 

Ex;
For Creating new reservation;
```
curl --location --request POST 'http://localhost:3000/reserve' \
--header 'Content-Type: application/json' \
--data-raw '{
    "tableId" : 2,
    "peopleCount": 3,
    "startDate": "2022-03-15T14:00:00.000Z"
}'
```
For updating the  reservation just created;
```
curl --location --request POST 'http://localhost:3000/reserve' \
--header 'Content-Type: application/json' \
--data-raw '{
    "tableId" : 2,
    "peopleCount": 3,
    "startDate": "2022-03-15T14:00:00.000Z",
    "reservationId": "reservation_id_that_is_created_before"
}'
```
The other requests explain themselves, you can test with calling them.



## Final Thoughts
Since I am used to coding with java, NodeJs was very difficult for me. In particular, it required research for me to set up the structure of the application correctly. While developing the project, I spent the most time on google. I looked at the sample projects so that I could develop quickly, I read the documents of the libraries I used. The most difficult thing in this project was to learn the coding language and structure, not the algorithm and working logic of the application. Therefore I was only able to develop the first api. It was a slow process for me because I had to understand how the code I wrote worked.

All in all, this is my first app. I'm happy to be able to develop an application that can work, despite its shortcomings. 


