let skip = 0; //for pagination it use in query

document.addEventListener("click", function (event) {
  if (event.target.classList.contains("add_item")) {
    event.preventDefault();
    console.log("add item");
    const tittle = document.getElementById("tittle").value;
    const author = document.getElementById("author").value;
    const prize = document.getElementById("prize").value;
    const category = document.getElementById("category").value;
    console.log(prize);

    if (prize === "") {
      alert("Please enter todo text");
      return;
    }

    axios
      .post("/create-item", { tittle, author, prize, category })
      .then((res) => {
        console.log(res);
        if (res.data.status !== 200) {
          alert(res.data.message);
        }

        document.getElementById("tittle").value = "";
        document.getElementById("author").value = "";
        document.getElementById("prize").value = "";
        document.getElementById("category").value = "";

        // document.getElementById("item_list").innerHTML = "";
        generateTodos();
        return;
      })
      .catch((err) => {
        console.log(err);
        alert(err);
      });
  }

  if (event.target.classList.contains("edit-me")) {
    const id = event.target.getAttribute("data-id");
    const tittle = prompt("Enter your tittle");
    const author = prompt("Enter your author");
    const prize = prompt("Enter your prize");
    const category = prompt("Enter your category");
    // console.log(event.target.parentElement);
    // console.log(event.target.parentElement.querySelector(".card-title"));
    axios
      .post("/edit-item", { id, tittle, author, prize, category })
      .then((res) => {
        if (res.data.status !== 200) {
          alert(res.data.message);
          return;
        }

        event.target.parentElement.querySelector(".card-title").innerHTML =
          tittle;
        event.target.parentElement.querySelector(".au").innerHTML = author;
        event.target.parentElement.querySelector(".pr").innerHTML = prize;
        event.target.parentElement.querySelector(".cat").innerHTML = category;
      })
      .catch((err) => {
        console.log(err);
        alert(err);
      });
  }
  if (event.target.classList.contains("delete-me")) {
    const id = event.target.getAttribute("data-id");

    axios
      .post("/delete-item", { id })
      .then((res) => {
        if (res.data.status !== 200) {
          alert(res.data.message);
          return;
        }

        event.target.parentElement.parentElement.remove();
        return;
      })
      .catch((err) => {
        console.log(err);
        alert(err);
      });
  }

  if (event.target.classList.contains("show_more")) {
    //for pagination
    generateTodos();
  }
});

window.onload = function () {
  generateTodos();
};

function generateTodos() {
  //read the todos
  axios
    .get(`/pagination_dashboard?skip=${skip}`)
    .then((res) => {
      if (res.data.status !== 200) {
        alert(res.data.message);
        return;
      }
      const todos = res.data.data;
      console.log(todos);
      document.getElementById("item_list").insertAdjacentHTML(
        "beforeend",
        todos
          .map((item) => {
            return `<div class="card" style="width: 18rem;">
  <div class="card-body">
    <h3 class="card-title">${item.tittle}</h3>
    <h6 class="card-subtitle mb-2 text-muted au">By ${item.author}</h6>
    <h6 class="card-subtitle mb-2 text-muted pr">${item.prize}</h6>
    <h6 class="card-subtitle mb-2 text-muted cat">${item.category}</h6>
    <button data-id="${item._id}" class="edit-me btn btn-secondary btn-sm mr-1">Update</button>
    <button data-id="${item._id}" class="delete-me btn btn-danger btn-sm">Delete</button>
  </div>
</div>
      `;
          })
          .join("")
      );

      //increment skip by todos length
      skip += todos.length;
    })
    .catch((err) => {
      console.log(err);
    });
}

// document.getElementById("item_list").insertAdjacentHTML(
//   "beforeend",
//   todos
//     .map((item) => {
//       return `<li class="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
//       <span class="item-text"> ${item.todo}</span>
//       <div>
//       <button data-id="${item._id}" class="edit-me btn btn-secondary btn-sm mr-1">Edit</button>
//       <button data-id="${item._id}" class="delete-me btn btn-danger btn-sm">Delete</button>
//   </div>
//   </li>`;
//     })
//     .join("")
// );
